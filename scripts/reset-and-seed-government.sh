#!/bin/bash

# Script to reset database and seed with government contributions
echo "🔄 Resetting database and seeding government contributions..."

# Step 1: Reset the entire database (clean + seed)
echo "Step 1: Running db:seed:reset..."
npm run db:seed:reset

echo "✅ Database reset complete!"
echo ""
echo "📊 The following government contributions have been seeded:"
echo "  - Philhealth contributions (5% total: 2.5% employee, 2.5% employer)"
echo "  - SSS contributions (14.5% total: 4.5% employee, 13.5% employer, 1% EC)"
echo "  - Pagibig contributions (2% employee, 2% employer)"
echo "  - Tax brackets (2024 rates)"
echo ""
echo "🎉 You can now test the payroll system!"
