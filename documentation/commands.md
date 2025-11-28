# HR Management System - Commands Documentation

This document provides comprehensive commands for setting up, managing, and running the HR Management System.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database running locally
- Git

### Initial Setup Commands

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
# Copy .env.example to .env and configure your database URL
cp .env.example .env

# 3. Generate Prisma client
npm run db:generate

# 4. Create database schema
npm run db:push

# 5. Seed database with sample data
npm run db:seed

# 6. Start development server
npm run dev
```

## 📋 Available Commands

### Database Commands

```bash
# Generate Prisma client (run after schema changes)
npm run db:generate

# Push schema changes to database (creates/updates tables)
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with sample data
npm run db:seed

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
```

### Development Commands

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Database Validation

```bash
# Validate database connection and schema
npx tsx lib/validate-db.ts

# Validate database connection from .env credentials
npx tsx lib/validate-env-db.ts

# Test all login credentials and authentication
npx tsx lib/test-logins.ts

# Fix HR Manager role assignment (if needed)
npx tsx lib/fix-hr-role.ts

# Check database connection only
npx prisma db pull --preview-feature
```

## 🔧 Environment Setup

### 1. Database Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hrms"

# Auth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Better Auth Secret
BETTER_AUTH_SECRET="your-secret-key-generate-with-openssl"
```

### 2. Generate Better Auth Secret

```bash
# Generate a secure secret for Better Auth
openssl rand -base64 32
```

## 🗄️ Database Management

### Creating the Database

```bash
# Create PostgreSQL database
createdb hrms

# Or using psql
psql -c "CREATE DATABASE hrms;"
```

### Schema Management

```bash
# After modifying prisma/schema.prisma:
npm run db:generate  # Regenerate types
npm run db:push      # Apply changes to database

# View current schema
npx prisma db pull

# Reset database (use with caution)
npx prisma migrate reset
```

### Data Management

```bash
# Seed with sample data (includes users, departments, etc.)
npm run db:seed

# View data in Prisma Studio
npm run db:studio

# Export data (custom script)
npx tsx scripts/export-data.ts

# Clear all data (keep schema)
npx tsx scripts/clear-data.ts
```

## 🧪 Testing & Validation

### Database Connection Test

```bash
# Run comprehensive database validation
npx tsx lib/validate-db.ts

# Test specific tables
npx tsx -e "
import { prisma } from './lib/db';
(async () => {
  const count = await prisma.organization.count();
  console.log('Organizations:', count);
  await prisma.\$disconnect();
})();
"
```

### API Testing

```bash
# Test API endpoints (requires server running)
curl http://localhost:3000/api/organizations
curl http://localhost:3000/api/employees
curl http://localhost:3000/api/departments
curl http://localhost:3000/api/dashboard/stats

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@techcorp.com","password":"admin123"}'
```

## 🚨 Troubleshooting Commands

### Common Issues

```bash
# If TypeScript errors persist:
npm run build  # Check for build errors
rm -rf .next   # Clear Next.js cache
npm run dev    # Restart dev server

# If database connection fails:
npx tsx lib/validate-db.ts      # Validate connection
npx tsx lib/validate-env-db.ts # Validate .env credentials
npm run db:push                # Ensure schema exists

# If authentication issues:
npx tsx lib/test-logins.ts     # Test all login credentials
npx tsx lib/fix-hr-role.ts      # Fix HR role assignment
npm run db:seed                 # Reseed users

# If import path errors:
# Check that all imports use relative paths in app/ directory
# Ensure no @/ components remain in app/ files

# If Prisma client issues:
npm run db:generate  # Regenerate client
rm -rf node_modules/@prisma  # Clear Prisma cache
npm install           # Reinstall dependencies

# If port 3000 is in use:
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
lsof -ti:3001 | xargs kill -9  # Kill process on port 3001
```

### Log Files

```bash
# Check Next.js logs
tail -f .next/server.log

# Check database logs (PostgreSQL)
tail -f /var/log/postgresql/postgresql-*.log

# Environment variables check
env | grep -E "(DATABASE|NODE|NEXT)"
```

## 📊 Monitoring Commands

### Development Monitoring

```bash
# Watch file changes
npm run dev -- --turbopack  # Faster builds (experimental)

# Monitor memory usage
node --inspect npm run dev

# Performance testing
npm run build && npm start
```

### Database Monitoring

```bash
# Active connections
psql -d hrms -c "SELECT * FROM pg_stat_activity;"

# Table sizes
psql -d hrms -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Query performance
psql -d hrms -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

## 🔄 Development Workflow

### Daily Development

```bash
# Start fresh development session
npm run dev

# In another terminal, make schema changes:
# 1. Edit prisma/schema.prisma
# 2. npm run db:generate
# 3. npm run db:push

# Reset data if needed:
npm run db:seed
```

### Before Deployment

```bash
# 1. Run full test suite
npm run lint
npm run build

# 2. Validate database
npx tsx lib/validate-db.ts

# 3. Check environment variables
cat .env

# 4. Production build test
npm run build && npm start
```

## 📱 Useful Scripts

### Custom Scripts (create as needed)

```bash
# scripts/export-data.ts - Export all data
# scripts/import-data.ts - Import data from file
# scripts/backup-db.ts - Database backup
# scripts/clean-deploy.ts - Clean deployment setup
```

## 🔐 Security Commands

```bash
# Generate secure secrets
openssl rand -base64 32
openssl rand -hex 32

# Check environment variables security
env | grep -i "secret\|key\|password" | head -5

# Audit dependencies
npm audit
npm audit fix
```

## 📚 Additional Resources

- [Prisma CLI Commands](https://www.prisma.io/docs/reference/api-reference/cli-reference)
- [Next.js CLI Commands](https://nextjs.org/docs/api-reference/cli)
- [PostgreSQL Commands](https://www.postgresql.org/docs/current/app-psql.html)

---

**Note**: Always run `npm run db:generate` after making changes to the Prisma schema. The development server automatically hot-reloads for most changes.
