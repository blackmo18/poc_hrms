# HR Management System - Login Credentials Guide

This document provides quick access to all login credentials and user access information for the HR Management System.

## 🔑 Default Login Credentials

### Pre-configured Users (Ready to Use)

| User | Email | Password | Role | Department | Access Level |
|------|-------|----------|------|------------|-------------|
| **System Admin** | admin@techcorp.com | admin123 | ADMIN | Human Resources | 🔥 Full Access |
| **HR Manager** | jane.smith@techcorp.com | password123 | HR_MANAGER | Human Resources | ⚡ HR Access |
| **Senior Engineer** | john.doe@techcorp.com | password123 | EMPLOYEE | Engineering | 👤 Employee |
| **Sales Rep** | mike.johnson@techcorp.com | password123 | EMPLOYEE | Sales | 👤 Employee |

## 🚀 Quick Login

### Step 1: Start the Application
```bash
npm run dev
```
Visit: http://localhost:3000

### Step 2: Choose Your Login

#### For Full System Access (Admin)
- **Email**: admin@techcorp.com
- **Password**: admin123
- **Access**: All features including user management, payroll, system settings

#### For HR Management (HR Manager)
- **Email**: jane.smith@techcorp.com  
- **Password**: password123
- **Access**: Employee management, leave approval, payroll processing

#### For Employee Self-Service (Any Employee)
- **Email**: john.doe@techcorp.com or mike.johnson@techcorp.com
- **Password**: password123
- **Access**: View profile, submit leave requests, view payslips

## 🎭 Role Capabilities

### 🔥 System Admin (admin@techcorp.com)
- ✅ Create and manage users
- ✅ Create and manage employees
- ✅ Process payroll
- ✅ Approve/reject leave requests
- ✅ Manage departments and job titles
- ✅ View all system reports
- ✅ System configuration

### ⚡ HR Manager (jane.smith@techcorp.com)
- ✅ Create and manage employees
- ✅ Approve/reject leave requests
- ✅ Process payroll
- ✅ Manage departments
- ✅ View employee reports
- ❌ Cannot manage system users or settings

### 👤 Employee (john.doe@techcorp.com, mike.johnson@techcorp.com)
- ✅ View own profile
- ✅ Submit leave requests
- ✅ View own payslips
- ✅ View company directory
- ❌ Cannot manage other users

## 🔄 First-Time Setup

### If Users Don't Exist
```bash
# Seed the database to create all users
npm run db:seed

# Verify users exist
npx tsx -e "
import { prisma } from './lib/db';
(async () => {
  const users = await prisma.user.findMany({select: {email: true, status: true}});
  console.log('Available users:', users);
  await prisma.\$disconnect();
})();
"
```

### Reset Passwords
```bash
# Reset all passwords to defaults (run as admin)
npx tsx -e "
import { userController } from './lib/controllers/user.controller';
import bcrypt from 'bcryptjs';
(async () => {
  const hashed = await bcrypt.hash('admin123', 10);
  // Update password for admin user
  console.log('Password reset instructions in authentication.md');
})();
"
```

## 🧪 Testing Different Roles

### Test Admin Access
1. Login as **admin@techcorp.com** / **admin123**
2. Navigate to Dashboard → should see all statistics
3. Try accessing Employees → should see full employee list
4. Try Payroll → should see all payroll data

### Test HR Manager Access  
1. Login as **jane.smith@techcorp.com** / **password123**
2. Navigate to Dashboard → should see HR-relevant stats
3. Try Employees → should see employee management
4. Try Leave → should be able to approve/reject requests

### Test Employee Access
1. Login as **john.doe@techcorp.com** / **password123**
2. Navigate to Dashboard → should see limited view
3. Try accessing management features → should be restricted
4. Try submitting leave request → should work

## 🛡️ Security Notes

### ⚠️ Important Security Reminders
- **Default passwords** are for development/testing only
- **Change passwords** before production deployment
- **Use strong passwords** for production users
- **Enable HTTPS** in production
- **Configure OAuth** for production authentication

### 🔒 Production Password Policy
```bash
# Generate secure passwords
openssl rand -base64 16  # 16-character random password

# Example secure password format
# - Minimum 12 characters
# - Mix of uppercase, lowercase, numbers, symbols
# - No dictionary words
```

## 📱 Login Troubleshooting

### "Invalid credentials" Error
```bash
# 1. Check if user exists
npx tsx -e "
import { prisma } from './lib/db';
(async () => {
  const user = await prisma.user.findUnique({where: {email: 'admin@techcorp.com'}});
  console.log('User exists:', !!user);
  console.log('User status:', user?.status);
  await prisma.\$disconnect();
})();
"

# 2. Verify database is seeded
npm run db:seed
```

### "Access denied" Error
```bash
# Check user role
npx tsx -e "
import { prisma } from './lib/db';
(async () => {
  const user = await prisma.user.findUnique({
    where: {email: 'jane.smith@techcorp.com'},
    include: {userRoles: {include: {role: true}}}
  });
  console.log('User role:', user?.userRoles[0]?.role?.name);
  await prisma.\$disconnect();
})();
"
```

### Session Issues
```bash
# Clear browser data
# 1. Clear cookies for localhost
# 2. Clear localStorage
# 3. Restart browser

# Restart development server
npm run dev
```

## 🔧 Creating New Users

### Quick User Creation
```bash
# Create new HR user
npx tsx -e "
import { userController } from './lib/controllers/user.controller';
(async () => {
  const user = await userController.create({
    organization_id: 'your-org-id',
    email: 'new.hr@company.com',
    password: 'temp123',
    status: 'ACTIVE'
  });
  console.log('Created user:', user.email);
})();
"
```

### Assign Role to New User
```sql
-- Get role IDs first
SELECT id, name FROM roles;

-- Assign HR Manager role
INSERT INTO user_roles (user_id, role_id, created_at)
VALUES (
  'user-id-from-above',
  'hr-manager-role-id',
  NOW()
);
```

## 📊 User Statistics

### View All Users
```bash
npx tsx -e "
import { prisma } from './lib/db';
(async () => {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      status: true,
      created_at: true,
      userRoles: {
        include: {role: {select: {name: true}}}
      }
    }
  });
  console.log('Users:');
  users.forEach(user => {
    const role = user.userRoles[0]?.role?.name || 'No role';
    console.log(\`  \${user.email} (\${role}) - \${user.status}\`);
  });
  await prisma.\$disconnect();
})();
"
```

### User Activity
```bash
# Recent login attempts
npx tsx -e "
import { prisma } from './lib/db';
(async () => {
  const logs = await prisma.auditLog.findMany({
    where: {action_type: 'LOGIN'},
    take: 10,
    orderBy: {timestamp: 'desc'},
    include: {user: {select: {email: true}}}
  });
  console.log('Recent logins:');
  logs.forEach(log => {
    console.log(\`  \${log.user?.email} at \${log.timestamp}\`);
  });
  await prisma.\$disconnect();
})();
"
```

## 🚀 Production Checklist

### Before Going Live
- [ ] Change all default passwords
- [ ] Set up OAuth providers
- [ ] Configure HTTPS
- [ ] Set up session timeouts
- [ ] Enable audit logging
- [ ] Test all user roles
- [ ] Configure password policy
- [ ] Set up backup authentication

### Environment Variables for Production
```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
BETTER_AUTH_SECRET="your-secure-32-byte-secret"
NEXTAUTH_URL="https://your-domain.com"

# OAuth providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## 📞 Quick Reference

| Need | Command | Action |
|------|---------|--------|
| **Create users** | `npm run db:seed` | Creates all default users |
| **Test login** | Visit http://localhost:3000 | Use any credential above |
| **Check users** | See "View All Users" section | Verify user database |
| **Reset passwords** | See authentication.md | Detailed password reset |
| **Troubleshoot** | See troubleshooting section | Common login issues |

**🎉 Ready to test! Start with `npm run dev` and login as admin@techcorp.com / admin123**
