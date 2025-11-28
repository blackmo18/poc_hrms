# HR Management System - Validation Guide

This document provides comprehensive validation procedures to ensure the HR Management System is working correctly.

## 🔍 Validation Overview

The HR Management System includes multiple validation scripts to verify:
- Database connectivity and schema
- Authentication and login credentials
- User roles and permissions
- API endpoint functionality

## 📊 Validation Scripts

### 1. Database Connection Validation

#### Basic Database Test
```bash
npx tsx lib/validate-db.ts
```
**What it tests:**
- Database connection establishment
- Schema existence (29 tables)
- Basic query execution
- Sample data presence

**Expected Output:**
```
✅ Database connection successful
✅ Basic query test passed
✅ Database schema accessible, tables: 29
✅ Organizations table accessible, count: 1
```

#### Environment Variables Test
```bash
npx tsx lib/validate-env-db.ts
```
**What it tests:**
- .env file loading
- DATABASE_URL configuration
- Connection string parsing
- PostgreSQL version detection

**Expected Output:**
```
📊 Environment Information:
   DATABASE_URL: ✅ Set
   Database: hrms
   Host: localhost
   Port: 5432
✅ Database connection successful!
```

### 2. Authentication Validation

#### Login Credentials Test
```bash
npx tsx lib/test-logins.ts
```
**What it tests:**
- All user login credentials
- Password verification
- User role assignments
- Authentication flow

**Expected Output:**
```
🔐 Testing Login Credentials
✅ admin@techcorp.com: LOGIN SUCCESS (Role: ADMIN)
✅ jane.smith@techcorp.com: LOGIN SUCCESS (Role: HR_MANAGER)
✅ john.doe@techcorp.com: LOGIN SUCCESS (Role: EMPLOYEE)
✅ mike.johnson@techcorp.com: LOGIN SUCCESS (Role: EMPLOYEE)
❌ admin@techcorp.com: LOGIN FAILED (Wrong password)
📊 Result: 5/5 tests passed
🎉 ALL LOGIN TESTS PASSED!
```

#### Role Assignment Fix
```bash
npx tsx lib/fix-hr-role.ts
```
**What it tests:**
- HR Manager role assignment
- Permission configuration
- User role corrections

**When to use:**
- If HR Manager has incorrect role
- After database reseeding
- When role permissions seem wrong

### 3. API Endpoint Validation

#### Manual API Testing
```bash
# Test organizations endpoint
curl http://localhost:3000/api/organizations

# Test employees endpoint
curl http://localhost:3000/api/employees

# Test dashboard stats
curl http://localhost:3000/api/dashboard/stats

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@techcorp.com","password":"admin123"}'
```

## 🎯 Complete Validation Workflow

### Initial Setup Validation
```bash
# 1. Install dependencies
npm install

# 2. Setup database
npm run db:push
npm run db:generate
npm run db:seed

# 3. Validate everything
npx tsx lib/validate-db.ts
npx tsx lib/validate-env-db.ts
npx tsx lib/test-logins.ts

# 4. Start application
npm run dev
```

### Pre-Deployment Validation
```bash
# 1. Clear caches
rm -rf .next

# 2. Validate database
npx tsx lib/validate-env-db.ts

# 3. Test authentication
npx tsx lib/test-logins.ts

# 4. Build application
npm run build

# 5. Test in production mode
npm start
```

## 🔧 Troubleshooting Validation

### Database Issues

#### Connection Failed
```bash
# Check PostgreSQL status
pg_isready

# Test direct connection
psql postgresql://user:pass@localhost:5432/hrms

# Recreate database
createdb hrms
npm run db:push
npm run db:seed
```

#### Schema Issues
```bash
# Check table count
npx tsx -e "
import { prisma } from './lib/db';
(async () => {
  const count = await prisma.\$queryRaw\`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'\`;
  console.log('Tables:', count[0]?.count);
  await prisma.\$disconnect();
})();
"

# Recreate schema
npm run db:push --force-reset
npm run db:seed
```

### Authentication Issues

#### Login Failures
```bash
# Test specific user
npx tsx -e "
import { userController } from './lib/controllers/user.controller';
(async () => {
  const result = await userController.verifyPassword('admin@techcorp.com', 'admin123');
  console.log('Login result:', result ? 'SUCCESS' : 'FAILED');
})();
"

# Fix HR role
npx tsx lib/fix-hr-role.ts

# Reseed users
npm run db:seed
```

#### Permission Issues
```bash
# Check user roles
npx tsx -e "
import { prisma } from './lib/db';
(async () => {
  const users = await prisma.user.findMany({
    include: { userRoles: { include: { role: true } } }
  });
  users.forEach(user => {
    console.log(\`\${user.email}: \${user.userRoles[0]?.role?.name || 'No role'}\`);
  });
  await prisma.\$disconnect();
})();
"
```

### Import Path Issues

#### Module Resolution Errors
```bash
# Check for @/ imports in app/ directory
grep -r "@/components" app/

# Common fixes:
# 1. Change @/components/ui/button to ../components/ui/button
# 2. Change @/lib/utils to ../../lib/utils
# 3. Restart TypeScript server
```

## 📈 Validation Metrics

### Success Indicators
- ✅ Database connection: Success
- ✅ Schema tables: 29 found
- ✅ Sample data: 4 users, 1 organization
- ✅ Login tests: 5/5 passed
- ✅ API endpoints: All responding
- ✅ Build process: No errors

### Performance Benchmarks
- Database connection: < 1 second
- Login verification: < 500ms
- API response time: < 200ms
- Build time: < 30 seconds

## 🚀 Automated Validation

### CI/CD Pipeline
```bash
# Add to .github/workflows/validate.yml
name: Validate HR System
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run db:push
      - run: npm run db:seed
      - run: npx tsx lib/validate-db.ts
      - run: npx tsx lib/test-logins.ts
      - run: npm run build
```

### Pre-commit Hooks
```bash
# Add to package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npx tsx lib/validate-db.ts"
    }
  }
}
```

## 📞 Support

### Validation Fails?
1. **Check this guide first** - Most issues are covered
2. **Run individual tests** - Isolate the problem
3. **Check environment** - .env file, PostgreSQL status
4. **Clear caches** - rm -rf .next, npm cache clean
5. **Recreate database** - Last resort, but often fixes issues

### Getting Help
- Check the validation script output for specific error messages
- Review the troubleshooting sections above
- Consult the main documentation in the documentation/ folder
- Check the plan.md for current project status

---

**Remember**: Validation scripts are your friends! They help ensure the system is working correctly before you start development or deploy to production.
