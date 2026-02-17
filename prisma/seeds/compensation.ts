import { PrismaClient, PayFrequency } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

// NCR Salary Packages (Monthly, in PHP)
const NCR_SALARY_RANGES = {
  // Executive Level
  'CEO': { min: 200000, max: 500000, average: 350000 },
  'CTO': { min: 180000, max: 400000, average: 290000 },
  'CFO': { min: 170000, max: 380000, average: 275000 },
  'COO': { min: 160000, max: 350000, average: 255000 },
  
  // Director Level
  'Engineering Director': { min: 120000, max: 250000, average: 185000 },
  'Finance Director': { min: 100000, max: 200000, average: 150000 },
  'HR Director': { min: 90000, max: 180000, average: 135000 },
  'Marketing Director': { min: 95000, max: 190000, average: 142500 },
  
  // Manager Level
  'Engineering Manager': { min: 80000, max: 150000, average: 115000 },
  'Senior Engineering Manager': { min: 100000, max: 180000, average: 140000 },
  'Product Manager': { min: 70000, max: 130000, average: 100000 },
  'Senior Product Manager': { min: 90000, max: 160000, average: 125000 },
  'Project Manager': { min: 60000, max: 110000, average: 85000 },
  'Senior Project Manager': { min: 75000, max: 140000, average: 107500 },
  'Finance Manager': { min: 55000, max: 100000, average: 77500 },
  'HR Manager': { min: 50000, max: 90000, average: 70000 },
  'Marketing Manager': { min: 55000, max: 100000, average: 77500 },
  'Sales Manager': { min: 60000, max: 120000, average: 90000 },
  'Operations Manager': { min: 55000, max: 100000, average: 77500 },
  'IT Manager': { min: 65000, max: 120000, average: 92500 },
  
  // Senior Professional Level
  'Senior Software Engineer': { min: 50000, max: 90000, average: 70000 },
  'Principal Software Engineer': { min: 70000, max: 120000, average: 95000 },
  'Lead Software Engineer': { min: 60000, max: 110000, average: 85000 },
  'Senior UX Designer': { min: 45000, max: 80000, average: 62500 },
  'Senior Product Designer': { min: 50000, max: 90000, average: 70000 },
  'Senior Data Analyst': { min: 45000, max: 85000, average: 65000 },
  'Senior Data Scientist': { min: 70000, max: 130000, average: 100000 },
  'Senior DevOps Engineer': { min: 65000, max: 110000, average: 87500 },
  'Senior QA Engineer': { min: 40000, max: 70000, average: 55000 },
  'Senior Business Analyst': { min: 50000, max: 90000, average: 70000 },
  'Senior Accountant': { min: 35000, max: 60000, average: 47500 },
  'Senior HR Specialist': { min: 30000, max: 50000, average: 40000 },
  'Senior Marketing Specialist': { min: 35000, max: 60000, average: 47500 },
  'Senior Sales Executive': { min: 40000, max: 80000, average: 60000 },
  
  // Professional Level
  'Software Engineer': { min: 30000, max: 60000, average: 45000 },
  'UX Designer': { min: 25000, max: 50000, average: 37500 },
  'Product Designer': { min: 30000, max: 55000, average: 42500 },
  'Data Analyst': { min: 25000, max: 50000, average: 37500 },
  'DevOps Engineer': { min: 35000, max: 65000, average: 50000 },
  'QA Engineer': { min: 20000, max: 40000, average: 30000 },
  'Business Analyst': { min: 30000, max: 55000, average: 42500 },
  'Accountant': { min: 20000, max: 35000, average: 27500 },
  'HR Specialist': { min: 18000, max: 30000, average: 24000 },
  'Marketing Specialist': { min: 20000, max: 35000, average: 27500 },
  'Sales Executive': { min: 22000, max: 45000, average: 33500 },
  'Content Writer': { min: 15000, max: 30000, average: 22500 },
  'Graphic Designer': { min: 18000, max: 35000, average: 26500 },
  'System Administrator': { min: 25000, max: 45000, average: 35000 },
  
  // Entry Level
  'Junior Software Engineer': { min: 18000, max: 30000, average: 24000 },
  'Junior UX Designer': { min: 15000, max: 25000, average: 20000 },
  'Junior Data Analyst': { min: 15000, max: 28000, average: 21500 },
  'Junior QA Engineer': { min: 15000, max: 25000, average: 20000 },
  'Junior Accountant': { min: 12000, max: 20000, average: 16000 },
  'HR Assistant': { min: 10000, max: 18000, average: 14000 },
  'Marketing Assistant': { min: 12000, max: 20000, average: 16000 },
  'Sales Associate': { min: 12000, max: 25000, average: 18500 },
  'Admin Assistant': { min: 10000, max: 18000, average: 14000 },
  
  // Default for any role not specified
  'default': { min: 15000, max: 30000, average: 22500 }
};

function getSalaryForJobTitle(jobTitleName: string) {
  // Try to find exact match first
  if (NCR_SALARY_RANGES[jobTitleName as keyof typeof NCR_SALARY_RANGES]) {
    const range = NCR_SALARY_RANGES[jobTitleName as keyof typeof NCR_SALARY_RANGES];
    // Generate random salary within range
    const randomSalary = Math.random() * (range.max - range.min) + range.min;
    return Math.round(randomSalary / 1000) * 1000; // Round to nearest thousand
  }
  
  // Try partial matches
  for (const [key, range] of Object.entries(NCR_SALARY_RANGES)) {
    if (key !== 'default' && jobTitleName.toLowerCase().includes(key.toLowerCase())) {
      const randomSalary = Math.random() * (range.max - range.min) + range.min;
      return Math.round(randomSalary / 1000) * 1000;
    }
  }
  
  // Return default average if no match
  return NCR_SALARY_RANGES.default.average;
}

export async function seedCompensation(prisma: PrismaClient, generateULID: () => string, employees: any[], organization: any, seniorEngineer: any) {
  console.log('💰 Seeding compensation with NCR salary packages...');
  
  const compensationRecords = employees.map(employee => {
    const baseSalary = getSalaryForJobTitle(employee.jobTitle?.name || 'default');
    
    return {
      id: generateULID(),
      employeeId: employee.id,
      organizationId: organization.id,
      baseSalary: baseSalary,
      payFrequency: PayFrequency.MONTHLY,
      effectiveDate: new Date('2024-01-01'),
      departmentId: employee.departmentId || null,
    };
  });

  // Create compensation records
  await prisma.compensation.createMany({
    data: compensationRecords,
  });

  // Log salary statistics
  const salaries = compensationRecords.map(r => r.baseSalary);
  const minSalary = Math.min(...salaries);
  const maxSalary = Math.max(...salaries);
  const avgSalary = salaries.reduce((a, b) => a + b, 0) / salaries.length;
  
  console.log(`✅ Created ${compensationRecords.length} compensation records`);
  console.log(`📊 Salary Range: ₱${minSalary.toLocaleString()} - ₱${maxSalary.toLocaleString()}`);
  console.log(`📊 Average Salary: ₱${Math.round(avgSalary).toLocaleString()}`);
}
