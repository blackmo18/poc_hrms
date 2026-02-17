# Payroll Test Data Generation Scripts

This directory contains scripts to generate and cleanup realistic payroll test data for testing purposes.

## Scripts

### 1. generate-payroll-test-data.ts
Generates realistic payroll test data including:
- New employee with user account
- Compensation and government info
- Time entries with realistic patterns:
  - 30% chance of late arrival (5-35 minutes)
  - 25% chance of overtime (30-150 minutes)
  - 5% chance of absence
- Overtime requests (auto-approved)
- Leave requests (sick leave)

### Usage Examples:
```bash
# Generate for current month
tsx scripts/generate-payroll-test-data.ts

# Generate for specific month and employee
tsx scripts/generate-payroll-test-data.ts 2024-01 "John Doe"

# Generate for December 2024
tsx scripts/generate-payroll-test-data.ts 2024-12 "Jane Smith"
```

**Output includes:**
- Employee details (email: firstname.lastname@testpayroll.com)
- Work statistics (days worked, late days, overtime hours)
- Expected payroll calculation summary

### 2. cleanup-payroll-test-data.ts
Removes all test data created by the generation script.

**Usage:**
```bash
# Clean up all test employees (emails ending with @testpayroll.com)
tsx scripts/cleanup-payroll-test-data.ts

# Clean up specific employee
tsx scripts/cleanup-payroll-test-data.ts john.doe@testpayroll.com
```

## Features

### Realistic Data Patterns
- **Late Arrivals**: 30% probability, 5-35 minutes late
- **Overtime**: 25% probability, 30-150 minutes after work
- **Absences**: 5% probability per workday
- **Weekends**: Automatically skipped
- **Holidays**: Philippine 2024 holidays considered

### Employee Details
- Default salary: PHP 45,000/month
- Department: Engineering
- Position: Software Engineer
- Government IDs: SSS, PhilHealth, Pagibig, TIN

### Generated Records
1. Employee & User account
2. Compensation record
3. Government information
4. Daily time entries with lunch breaks
5. Overtime requests (approved)
6. Leave requests (approved)

## Testing Workflow

1. **Generate test data** for desired month
2. **Run payroll generation** through the application
3. **Verify calculations** include:
   - Base salary
   - Overtime pay (1.25x for regular days, 1.30x for rest days)
   - Late deductions
   - Government contributions
   - Tax deductions
4. **Cleanup data** when done

## Notes

- Scripts use Prisma client with the same database as your application
- All dates are in Asia/Manila timezone
- Generated emails use pattern: firstname.lastname@testpayroll.com
- Default password for generated users: `password123`
- Test organization is automatically created if it doesn't exist
- Cleanup removes all dependent records in correct order
