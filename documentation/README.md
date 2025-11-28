# HR Management System Documentation

This directory contains comprehensive documentation for the HR Management System.

## 📚 Documentation Files

### 🚀 Quick Start
- **[quick-start.md](./quick-start.md)** - 5-minute setup guide for getting the system running immediately

### 📋 Commands Reference  
- **[commands.md](./commands.md)** - Complete list of all available commands, database operations, and troubleshooting

### 🔍 Validation & Testing
- **[validation-guide.md](./validation-guide.md)** - Comprehensive validation procedures and troubleshooting

### 📖 Additional Documentation (Coming Soon)
- API Documentation
- User Guide
- Deployment Guide
- Customization Guide

## 🎯 Quick Navigation

### For New Users
1. Start with [quick-start.md](./quick-start.md) to get running immediately
2. Use [commands.md](./commands.md) for detailed command reference
3. Check [validation-guide.md](./validation-guide.md) to verify setup

### For Developers
1. Review [commands.md](./commands.md) for development workflow
2. Use [validation-guide.md](./validation-guide.md) for testing procedures
3. Check the main [README.md](../README.md) for project overview
4. Examine `prisma/schema.prisma` for database structure

### For System Administrators
1. Use [commands.md](./commands.md) for deployment and maintenance
2. Follow [validation-guide.md](./validation-guide.md) for system validation
3. Use [authentication.md](./authentication.md) for user management

## 🔧 Common Tasks

### Initial Setup
```bash
# Quick setup (see quick-start.md for details)
npm install
npm run db:push
npm run db:seed
npm run dev
```

### Daily Development
```bash
# Start development server
npm run dev

# After schema changes
npm run db:generate
npm run db:push

# Validate database
npx tsx lib/validate-db.ts
```

### Database Management
```bash
# After modifying prisma/schema.prisma:
npm run db:generate  # Regenerate types
npm run db:push      # Apply changes to database

# View current schema
npx prisma db pull

# Reset database (use with caution)
npx prisma migrate reset
```

### Data Management & Validation
```bash
# Seed with sample data (includes users, departments, etc.)
npm run db:seed

# Validate database connection and data
npx tsx lib/validate-db.ts
npx tsx lib/validate-env-db.ts

# Test authentication and login credentials
npx tsx lib/test-logins.ts

# Fix common issues (HR role assignment)
npx tsx lib/fix-hr-role.ts

# View data in Prisma Studio
npm run db:studio

# Export data (custom script)
npx tsx scripts/export-data.ts

# Clear all data (keep schema)
npx tsx scripts/clear-data.ts
```

## 🆘 Getting Help

### Self-Service
- Check [commands.md](./commands.md) for troubleshooting
- Run [validation-guide.md](./validation-guide.md) scripts to diagnose issues
- Review the main project README for architecture overview

### Common Issues & Solutions
- **Database Connection**: Ensure PostgreSQL is running and DATABASE_URL is correct
- **Port Conflicts**: Use `lsof -ti:3000 | xargs kill -9` to free port 3000
- **TypeScript Errors**: Clear caches with `rm -rf .next`
- **Permission Errors**: Check file permissions and run with appropriate user

## 📊 System Overview

### Core Features
- ✅ User Authentication (local + OAuth2)
- ✅ Employee Management
- ✅ Department & Job Title Management
- ✅ Leave Request System
- ✅ Payroll Processing
- ✅ Role-Based Access Control
- ✅ Audit Logging

### Technology Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Better Auth
- **UI**: Radix UI Components

### Project Structure
```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   └── [pages]/           # Application pages
├── lib/                   # Utilities and configurations
│   ├── controllers/       # Business logic
│   ├── models/           # TypeScript models
│   └── auth.ts           # Authentication setup
├── prisma/               # Database schema and migrations
├── documentation/        # This documentation
└── README.md            # Main project README
```

## 🚀 Deployment Notes

### Environment Variables Required
```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="optional"
GOOGLE_CLIENT_SECRET="optional"
GITHUB_CLIENT_ID="optional" 
GITHUB_CLIENT_SECRET="optional"
```

### Production Checklist
- [ ] Set production DATABASE_URL
- [ ] Generate secure BETTER_AUTH_SECRET
- [ ] Configure OAuth providers (if needed)
- [ ] Run `npm run build` successfully
- [ ] Test all API endpoints
- [ ] Verify database connection

---

**Last Updated**: November 2024  
**Version**: 1.0.0  
**Framework**: Next.js 14 + Prisma 5
