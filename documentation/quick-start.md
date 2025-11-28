# HR Management System - Quick Start Guide

Get the HR Management System running in minutes with this step-by-step guide.

## ⚡ 5-Minute Setup

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ PostgreSQL running locally
- ✅ Git installed

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Database
```bash
# Create .env file (copy from example if exists)
echo 'DATABASE_URL="postgresql://username:password@localhost:5432/hrms"' > .env
```

### Step 3: Setup Database
```bash
# Create database schema
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed with sample data
npm run db:seed

# Validate everything is working
npx tsx lib/validate-db.ts
npx tsx lib/test-logins.ts
```

### Step 4: Start Application
```bash
npm run dev
```

Visit http://localhost:3000 🎉

## 🔑 Login Credentials

After seeding, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@techcorp.com | admin123 |
| HR Manager | jane.smith@techcorp.com | password123 |
| Employee | john.doe@techcorp.com | password123 |
| Sales | mike.johnson@techcorp.com | password123 |

## 🧪 Validation Commands

```bash
# Test database connection
npx tsx lib/validate-db.ts

# Test .env database credentials
npx tsx lib/validate-env-db.ts

# Test all login credentials
npx tsx lib/test-logins.ts

# Test API endpoints
curl http://localhost:3000/api/organizations
curl http://localhost:3000/api/dashboard/stats
```

## 🚨 Common Issues & Solutions

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# Create database if needed
createdb hrms

# Test connection manually
psql postgresql://username:password@localhost:5432/hrms
```

### Port 3000 Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### TypeScript Errors
```bash
# Clear caches and restart
rm -rf .next node_modules/.cache
npm run dev
```

## 📱 What's Included

The system comes with:
- ✅ Complete user authentication
- ✅ Employee management
- ✅ Department management  
- ✅ Leave request system
- ✅ Payroll processing
- ✅ Role-based permissions
- ✅ Sample data for testing

## 🎯 Next Steps

1. **Explore the Dashboard** - View statistics and overview
2. **Manage Employees** - Add, edit, or remove employees
3. **Process Leave Requests** - Approve/reject employee leave
4. **Handle Payroll** - Process monthly payroll
5. **Customize** - Add your organization's data

## 📚 Need More Help?

- **Full Commands**: See `documentation/commands.md`
- **API Documentation**: Visit `/api` endpoints when running
- **Database Schema**: Check `prisma/schema.prisma`
- **Troubleshooting**: Run `npx tsx lib/validate-db.ts`

---

**Happy HR Managing! 🎊**
