# AI Integration Setup Guide

## Prerequisites

Before setting up AI integration, ensure you have:

- Node.js 18+ installed
- PostgreSQL database running
- Redis server (for caching and session management)
- API keys from AI providers (OpenAI, Anthropic, etc.)
- Existing HR Management System running

## Environment Configuration

### 1. Update Environment Variables

Add the following variables to your `.env` file:

```env
# AI Provider Configuration
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_ORGANIZATION_ID="org-your-organization-id"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
AZURE_OPENAI_API_KEY="your-azure-api-key"

# AI Service Configuration
AI_SERVICE_ENABLED=true
AI_DEFAULT_PROVIDER="openai"
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.7
AI_TIMEOUT_MS=30000

# Redis Configuration (for AI context management)
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="your-redis-password"

# Vector Database (optional, for advanced features)
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_ENVIRONMENT="your-pinecone-environment"
PINECONE_INDEX="hr-knowledge-base"

# AI Security & Compliance
AI_AUDIT_ENABLED=true
AI_PII_DETECTION_ENABLED=true
AI_CONTENT_FILTER_ENABLED=true
AI_RATE_LIMIT_PER_USER=100
AI_RATE_LIMIT_WINDOW_MS=3600000
```

### 2. Install Additional Dependencies

```bash
npm install openai @anthropic-ai/sdk @azure/openai langchain @pinecone-database/pinecone ioredis
```

Update your `package.json`:

```json
{
  "dependencies": {
    "openai": "^4.20.0",
    "@anthropic-ai/sdk": "^0.9.0",
    "@azure/openai": "^1.0.0-beta.8",
    "langchain": "^0.0.200",
    "@pinecone-database/pinecone": "^1.1.0",
    "ioredis": "^5.3.2",
    "uuid": "^9.0.1",
    "@types/uuid": "^9.0.7"
  }
}
```

## Database Schema Updates

### 1. Add AI-Related Tables

Create a new Prisma migration:

```prisma
// prisma/schema.prisma

model AIConversation {
  id          String   @id @default(cuid())
  userId      String
  sessionId   String
  agentType   String   // 'hr_assistant', 'recruitment', 'analytics', etc.
  title       String?
  status      String   @default("active") // 'active', 'archived', 'deleted'
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages    AIMessage[]
  
  @@map("ai_conversations")
}

model AIMessage {
  id             String         @id @default(cuid())
  conversationId String
  role           String         // 'user', 'assistant', 'system'
  content        String
  metadata       Json?
  tokens         Int?
  cost           Decimal?       @db.Decimal(10, 6)
  provider       String?        // 'openai', 'anthropic', 'azure'
  model          String?        // 'gpt-4', 'claude-3', etc.
  createdAt      DateTime       @default(now())
  
  conversation   AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  @@map("ai_messages")
}

model AIAuditLog {
  id          String   @id @default(cuid())
  userId      String
  action      String   // 'query', 'generate', 'analyze', etc.
  agentType   String
  input       String
  output      String?
  success     Boolean
  errorMessage String?
  tokens      Int?
  cost        Decimal? @db.Decimal(10, 6)
  duration    Int?     // milliseconds
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@map("ai_audit_logs")
}

model AIKnowledgeBase {
  id          String   @id @default(cuid())
  title       String
  content     String
  category    String   // 'policy', 'procedure', 'faq', etc.
  tags        String[]
  embedding   String?  // Vector embedding for similarity search
  source      String?  // Source document or URL
  version     Int      @default(1)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("ai_knowledge_base")
}

// Add relations to existing User model
model User {
  // ... existing fields
  aiConversations AIConversation[]
  aiAuditLogs     AIAuditLog[]
}
```

### 2. Run Database Migration

```bash
npx prisma db push
npx prisma generate
```

## Core AI Service Implementation

### 1. Create AI Configuration

```typescript
// lib/ai/config.ts
export const aiConfig = {
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      organization: process.env.OPENAI_ORGANIZATION_ID,
      defaultModel: 'gpt-4-turbo-preview',
      maxTokens: 4096,
      temperature: 0.7,
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY!,
      defaultModel: 'claude-3-sonnet-20240229',
      maxTokens: 4096,
      temperature: 0.7,
    },
    azure: {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      defaultModel: 'gpt-4',
      maxTokens: 4096,
      temperature: 0.7,
    },
  },
  defaultProvider: process.env.AI_DEFAULT_PROVIDER as 'openai' | 'anthropic' | 'azure',
  security: {
    auditEnabled: process.env.AI_AUDIT_ENABLED === 'true',
    piiDetectionEnabled: process.env.AI_PII_DETECTION_ENABLED === 'true',
    contentFilterEnabled: process.env.AI_CONTENT_FILTER_ENABLED === 'true',
  },
  rateLimiting: {
    perUser: parseInt(process.env.AI_RATE_LIMIT_PER_USER || '100'),
    windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS || '3600000'),
  },
};
```

### 2. Create AI Provider Clients

```typescript
// lib/ai/providers/openai.ts
import OpenAI from 'openai';
import { aiConfig } from '../config';

export class OpenAIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: aiConfig.providers.openai.apiKey,
      organization: aiConfig.providers.openai.organization,
    });
  }

  async generateResponse(prompt: string, options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }) {
    const response = await this.client.chat.completions.create({
      model: options?.model || aiConfig.providers.openai.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options?.maxTokens || aiConfig.providers.openai.maxTokens,
      temperature: options?.temperature || aiConfig.providers.openai.temperature,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      tokens: response.usage?.total_tokens || 0,
      model: response.model,
      cost: this.calculateCost(response.usage?.total_tokens || 0, response.model),
    };
  }

  private calculateCost(tokens: number, model: string): number {
    // Cost calculation based on OpenAI pricing
    const costPerToken = model.includes('gpt-4') ? 0.00003 : 0.000002;
    return tokens * costPerToken;
  }
}
```

### 3. Create Agent Manager

```typescript
// lib/ai/agents/manager.ts
import { OpenAIProvider } from '../providers/openai';
import { HRAssistantAgent } from './hr-assistant';
import { RecruitmentAgent } from './recruitment';
import { AnalyticsAgent } from './analytics';

export class AgentManager {
  private providers: Map<string, any> = new Map();
  private agents: Map<string, any> = new Map();

  constructor() {
    this.initializeProviders();
    this.initializeAgents();
  }

  private initializeProviders() {
    this.providers.set('openai', new OpenAIProvider());
    // Add other providers as needed
  }

  private initializeAgents() {
    this.agents.set('hr_assistant', new HRAssistantAgent(this.providers));
    this.agents.set('recruitment', new RecruitmentAgent(this.providers));
    this.agents.set('analytics', new AnalyticsAgent(this.providers));
  }

  async processRequest(agentType: string, request: {
    userId: string;
    message: string;
    context?: any;
    sessionId?: string;
  }) {
    const agent = this.agents.get(agentType);
    if (!agent) {
      throw new Error(`Agent type '${agentType}' not found`);
    }

    return await agent.process(request);
  }

  getAvailableAgents() {
    return Array.from(this.agents.keys());
  }
}
```

## API Endpoints Setup

### 1. Create AI Chat Endpoint

```typescript
// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AgentManager } from '@/lib/ai/agents/manager';
import { AIAuditService } from '@/lib/ai/services/audit';

const agentManager = new AgentManager();
const auditService = new AIAuditService();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, agentType = 'hr_assistant', sessionId, context } = await request.json();

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(session.user.id);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Process the request
    const startTime = Date.now();
    const response = await agentManager.processRequest(agentType, {
      userId: session.user.id,
      message,
      context,
      sessionId,
    });

    // Audit logging
    await auditService.log({
      userId: session.user.id,
      action: 'chat',
      agentType,
      input: message,
      output: response.content,
      success: true,
      tokens: response.tokens,
      cost: response.cost,
      duration: Date.now() - startTime,
      ipAddress: request.ip,
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI Chat Error:', error);
    
    // Audit error
    await auditService.log({
      userId: session?.user?.id || 'unknown',
      action: 'chat',
      agentType: 'unknown',
      input: 'Error occurred',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      duration: 0,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkRateLimit(userId: string) {
  // Implement rate limiting logic using Redis
  // Return { allowed: boolean, remaining: number, resetTime: Date }
  return { allowed: true, remaining: 99, resetTime: new Date() };
}
```

### 2. Create Agent-Specific Endpoints

```typescript
// app/api/ai/agents/hr-assistant/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { HRAssistantAgent } from '@/lib/ai/agents/hr-assistant';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { query, context } = await request.json();
  
  const agent = new HRAssistantAgent();
  const response = await agent.handleQuery({
    userId: session.user.id,
    query,
    context,
  });

  return NextResponse.json(response);
}
```

## Frontend Integration

### 1. Create AI Chat Component

```typescript
// app/components/ai/chat-interface.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIChatInterface({ agentType = 'hr_assistant' }: { agentType?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          agentType,
          sessionId: crypto.randomUUID(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Handle error state
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-96 p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-2 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <Bot className="w-6 h-6 mt-1 text-blue-500" />
            )}
            <div
              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content}
            </div>
            {message.role === 'user' && (
              <User className="w-6 h-6 mt-1 text-gray-500" />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="flex space-x-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about HR..."
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={isLoading}
        />
        <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
```

## Testing Setup

### 1. Create Test Configuration

```typescript
// tests/ai/setup.ts
import { beforeAll, afterAll } from 'vitest';
import { AgentManager } from '@/lib/ai/agents/manager';

let agentManager: AgentManager;

beforeAll(async () => {
  // Set up test environment
  process.env.AI_SERVICE_ENABLED = 'true';
  process.env.OPENAI_API_KEY = 'test-key';
  
  agentManager = new AgentManager();
});

afterAll(async () => {
  // Clean up test data
});

export { agentManager };
```

### 2. Create Integration Tests

```typescript
// tests/ai/integration.test.ts
import { describe, it, expect } from 'vitest';
import { agentManager } from './setup';

describe('AI Integration', () => {
  it('should process HR assistant queries', async () => {
    const response = await agentManager.processRequest('hr_assistant', {
      userId: 'test-user',
      message: 'What is the company leave policy?',
    });

    expect(response).toHaveProperty('content');
    expect(response.content).toBeTypeOf('string');
    expect(response.content.length).toBeGreaterThan(0);
  });

  it('should handle rate limiting', async () => {
    // Test rate limiting functionality
  });

  it('should audit all interactions', async () => {
    // Test audit logging
  });
});
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Redis server configured
- [ ] AI provider API keys validated
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] Security measures implemented
- [ ] Monitoring setup complete
- [ ] Integration tests passing
- [ ] Documentation updated

## Next Steps

1. **Implement Specific Agents**: Start with the HR Assistant agent
2. **Add Vector Database**: For advanced knowledge retrieval
3. **Implement Streaming**: For real-time responses
4. **Add Voice Interface**: For accessibility
5. **Create Analytics Dashboard**: For monitoring AI usage
6. **Implement Fine-tuning**: For domain-specific improvements

## Troubleshooting

### Common Issues

1. **API Key Errors**: Verify environment variables are set correctly
2. **Rate Limiting**: Check Redis connection and rate limit configuration
3. **Database Errors**: Ensure migrations are applied and connections are valid
4. **Performance Issues**: Monitor token usage and implement caching
5. **Security Concerns**: Review audit logs and implement proper access controls

### Support Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com)
- [LangChain Documentation](https://docs.langchain.com)
- [Project Issue Tracker](../../../issues)
