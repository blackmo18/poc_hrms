# HR Management System

A comprehensive HR management system built with Next.js, TypeScript, Tailwind CSS, and Prisma.

## Features

- Employee management
- Department and job title management
- Payroll processing
- Leave request management
- Document management
- Authentication with local and OAuth2 providers
- Role-based access control
- Audit logging
- Onboarding/offboarding workflows

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **UI Components**: Radix UI, Lucide Icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hr_management"

# Auth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Better Auth Secret
BETTER_AUTH_SECRET="your-secret-key"
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma db push
npx prisma generate
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses a comprehensive database schema based on the ERD in `erd.md`. Key entities include:

- Organizations
- Departments and Job Titles
- Users and Employees
- Roles and Permissions
- Payroll and Compensation
- Leave Requests
- Documents
- Audit Logs

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/organizations` - Organization management
- `/api/employees` - Employee management
- `/api/departments` - Department management
- `/api/dashboard/stats` - Dashboard statistics

## Project Structure

```
app/
├── api/                    # API routes
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── providers/        # Context providers
│   └── ui/               # UI components
├── dashboard/            # Dashboard pages
└── login/               # Login page

lib/
├── controllers/         # Business logic
├── models/              # TypeScript models and validation
├── auth.ts              # Authentication configuration
├── db.ts                # Database connection
└── utils.ts             # Utility functions

prisma/
└── schema.prisma       # Database schema
```

## Development

### Database Migrations

To make changes to the database schema:

1. Update `prisma/schema.prisma`
2. Run `npx prisma db push` to apply changes
3. Run `npx prisma generate` to update the client

### Adding New Features

1. Create models in `lib/models/`
2. Create controllers in `lib/controllers/`
3. Add API routes in `app/api/`
4. Create UI components as needed

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Better Auth Documentation](https://better-auth.com/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
