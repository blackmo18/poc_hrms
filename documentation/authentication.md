# HR Management System - Authentication & Login Credentials

This document provides comprehensive information about authentication, login credentials, and user access management in the HR Management System.

## 🔑 Default Login Credentials

### Pre-configured Users (After Database Seeding)

| Role | Email | Password | Permissions | Department |
|------|-------|----------|-------------|------------|
| **System Admin** | admin@techcorp.com | admin123 | Full system access | Human Resources |
| **HR Manager** | jane.smith@techcorp.com | password123 | Employee management, leave approval, payroll | Human Resources |
| **Senior Engineer** | john.doe@techcorp.com | password123 | Employee self-service | Engineering |
| **Sales Rep** | mike.johnson@techcorp.com | password123 | Employee self-service | Sales |

### Quick Access
```bash
# Seed database to create these users
npm run db:seed

# Test login with curl
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@techcorp.com","password":"admin123"}'
```

## 🎭 Role-Based Access Control (RBAC)

### Role Hierarchy & Permissions

#### **ADMIN Role**
- ✅ Create, read, update, delete users
- ✅ Create, read, update, delete employees  
- ✅ Process payroll
- ✅ Approve/reject leave requests
- ✅ Manage organizations and departments
- ✅ Full system configuration access

#### **HR_MANAGER Role**
- ✅ Create, read, update employees
- ✅ Read user information
- ✅ Approve/reject leave requests
- ✅ Process payroll
- ✅ Manage departments and job titles
- ❌ Cannot delete users or manage system settings

#### **EMPLOYEE Role**
- ✅ Read own employee profile
- ✅ Read user directory
- ✅ Submit leave requests
- ✅ View own payroll information
- ❌ Cannot manage other users or system data

### Permission Matrix

| Permission | Admin | HR Manager | Employee |
|------------|-------|------------|----------|
| users.create | ✅ | ❌ | ❌ |
| users.read | ✅ | ✅ | ✅ |
| users.update | ✅ | ❌ | ❌ |
| users.delete | ✅ | ❌ | ❌ |
| employees.create | ✅ | ✅ | ❌ |
| employees.read | ✅ | ✅ | ✅ (own) |
| employees.update | ✅ | ✅ | ❌ |
| employees.delete | ✅ | ❌ | ❌ |
| payroll.process | ✅ | ✅ | ❌ |
| leave.approve | ✅ | ✅ | ❌ |
| leave.submit | ✅ | ✅ | ✅ |

## 🔐 Authentication Methods

### 1. Local Authentication (Email/Password)
```typescript
// Login endpoint
POST /api/auth/login
{
  "email": "admin@techcorp.com",
  "password": "admin123"
}
```

### 2. OAuth2 Authentication (Optional)
Configure in `.env` file:
```env
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth  
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 3. Session Management
- Sessions expire after 7 days by default
- Automatic session refresh on activity
- Secure cookie-based sessions

## 👥 User Management

### Creating New Users

#### Method 1: Via API
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "organization_id": "org-id",
    "email": "newuser@company.com",
    "password_hash": "temporary123",
    "status": "ACTIVE"
  }'
```

#### Method 2: Database Direct
```sql
-- Insert new user directly
INSERT INTO users (id, organization_id, email, password_hash, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'org-id',
  'newuser@company.com',
  '$2b$10$hashedpassword...',
  'ACTIVE',
  NOW(),
  NOW()
);
```

### Assigning Roles
```sql
-- Assign role to user
INSERT INTO user_roles (user_id, role_id, created_at)
VALUES ('user-id', 'role-id', NOW());

-- Common role IDs (check your database for actual IDs)
-- ADMIN: role-id-1
-- HR_MANAGER: role-id-2  
-- EMPLOYEE: role-id-3
```

## 🛡️ Security Best Practices

### Password Security
- All passwords are hashed using bcrypt (cost factor: 10)
- Default passwords should be changed on first login
- Minimum password length: 6 characters
- Password complexity not enforced by default (add as needed)

### Session Security
```typescript
// Session configuration in lib/auth.ts
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  updateAge: 60 * 60 * 24,    // 1 day
}
```

### Environment Security
```bash
# Generate secure secrets
openssl rand -base64 32  # For Better Auth
openssl rand -hex 32     # Alternative secret

# Required environment variables
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="your-secure-secret"
```

## 🔄 Password Management

### Changing Passwords

#### Method 1: API (Admin)
```bash
curl -X PUT http://localhost:3000/api/users/user-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "password_hash": "newpassword123"
  }'
```

#### Method 2: Database Direct
```sql
-- Update password (requires hashing first)
UPDATE users 
SET password_hash = '$2b$10$newhashedpassword...', updated_at = NOW()
WHERE email = 'user@company.com';
```

### Password Reset Flow
1. User requests password reset
2. Admin generates temporary password
3. User logs in with temporary password
4. User changes password on first login

## 🚫 Access Control

### Failed Login Handling
- No account lockout (implement as needed)
- Login attempts logged in audit trail
- Rate limiting recommended for production

### Session Invalidation
```typescript
// Logout endpoint
POST /api/auth/logout

// Manual session invalidation (admin)
DELETE /api/auth/sessions/:sessionId
```

### IP Restrictions (Optional)
Configure in production to restrict access by IP ranges:
```env
ALLOWED_IPS="192.168.1.0/24,10.0.0.0/8"
```

## 📊 Audit Trail

### Authentication Events Logged
```sql
-- View authentication logs
SELECT * FROM audit_logs 
WHERE action_type = 'LOGIN' 
ORDER BY timestamp DESC;

-- View failed login attempts
SELECT * FROM audit_logs 
WHERE action_type = 'LOGIN_FAILED' 
ORDER BY timestamp DESC;
```

### User Activity Monitoring
```sql
-- Recent user activities
SELECT 
  u.email,
  al.action_type,
  al.entity_type,
  al.timestamp
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.timestamp > NOW() - INTERVAL '24 hours'
ORDER BY al.timestamp DESC;
```

## 🔧 Troubleshooting Authentication

### Common Issues & Solutions

#### "Invalid credentials" Error
```bash
# 1. Verify user exists
npx tsx -e "
import { prisma } from './lib/db';
(async () => {
  const user = await prisma.user.findUnique({where: {email: 'admin@techcorp.com'}});
  console.log('User:', user ? 'exists' : 'not found');
  await prisma.\$disconnect();
})();
"

# 2. Test password verification
npx tsx -e "
import { userController } from './lib/controllers/user.controller';
(async () => {
  const result = await userController.verifyPassword('admin@techcorp.com', 'admin123');
  console.log('Password valid:', result ? 'yes' : 'no');
})();
"
```

#### Session Issues
```bash
# Clear browser cookies and localStorage
# Restart development server
npm run dev

# Check session configuration
cat lib/auth.ts | grep -A 10 "session:"
```

#### Permission Denied Errors
```bash
# Check user roles
npx tsx -e "
import { prisma } from './lib/db';
(async () => {
  const user = await prisma.user.findUnique({
    where: {email: 'jane.smith@techcorp.com'},
    include: {userRoles: {include: {role: true}}}
  });
  console.log('User roles:', user?.userRoles);
  await prisma.\$disconnect();
})();
"
```

## 🚀 Production Authentication Setup

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Authentication
BETTER_AUTH_SECRET="your-secure-32-byte-secret"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-nextauth-secret"

# OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Security Headers
```typescript
// Add to middleware or next.config.js
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
];
```

## 📱 Testing Authentication

### Automated Tests
```bash
# Test login flow
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@techcorp.com","password":"admin123"}'

# Test authenticated request
curl -b cookies.txt http://localhost:3000/api/organizations

# Test logout
curl -b cookies.txt -X POST http://localhost:3000/api/auth/logout
```

### Manual Testing Checklist
- [ ] Login with each user role
- [ ] Verify role-based permissions
- [ ] Test session expiration
- [ ] Verify audit logging
- [ ] Test OAuth (if configured)
- [ ] Test password change flow

---

## 📞 Support

For authentication issues:
1. Check this documentation first
2. Run `npx tsx lib/validate-db.ts` to verify database
3. Review audit logs for error details
4. Check environment variables configuration

**Remember**: Change default passwords before production deployment!
