import { NextRequest, NextResponse } from 'next/server';
import { employeePayrollService } from '@/lib/service/employee-payroll.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employeeId } = await params;
    const searchParams = request.nextUrl.searchParams;
    
    const organizationId = searchParams.get('organizationId');
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');

    if (!organizationId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Missing required parameters: organizationId, periodStart, periodEnd' },
        { status: 400 }
      );
    }

    // Get payroll data
    const payrollData = await employeePayrollService.getEmployeePayroll(
      employeeId,
      organizationId,
      new Date(periodStart),
      new Date(periodEnd)
    );

    if (!payrollData) {
      return NextResponse.json(
        { error: 'Payroll data not found' },
        { status: 404 }
      );
    }

    // Generate HTML content
    const htmlContent = generatePayslipHTML(payrollData);

    // Return HTML for client-side printing
    // Note: For true server-side PDF generation, you'd need libraries like puppeteer
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="payslip-${employeeId}.html"`,
      },
    });
  } catch (error) {
    console.error('[PAYROLL API] Error generating payslip:', error);
    return NextResponse.json(
      { error: 'Failed to generate payslip' },
      { status: 500 }
    );
  }
}

function generatePayslipHTML(data: any): string {
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Payslip - ${data.firstName} ${data.lastName}</title>
  <style>
    @page {
      size: A4;
      margin: 10mm;
    }
    
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      background: white;
    }
    
    .payslip-container {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 24px;
      box-sizing: border-box;
      background: white;
    }
    
    .header {
      margin-bottom: 16px;
    }
    
    .company-name {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .company-info {
      font-size: 10px;
      color: #666;
      margin-bottom: 2px;
    }
    
    .title {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 5px;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 8px 0;
    }
    
    .section {
      margin-bottom: 16px;
    }
    
    .section-title {
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    
    th, td {
      padding: 4px;
      text-align: left;
      border-bottom: 1px solid #000;
    }
    
    th {
      font-weight: bold;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .border-2 {
      border: 2px solid #000;
      padding: 16px;
    }
    
    .font-bold {
      font-weight: bold;
    }
    
    .text-lg {
      font-size: 18px;
    }
    
    .text-xl {
      font-size: 20px;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="payslip-container">
    <div class="header">
      <div class="company-name">${data.company?.name || 'Company Name'}</div>
      <div class="company-info">${data.company?.address || 'Address'}</div>
      <div class="company-info">${data.company?.email || 'email@company.com'} | ${data.company?.contactNumber || 'Phone'}</div>
      
      <div class="title">
        PAYSLIP
      </div>
      <div class="company-info text-center">
        For the period: ${formatDate(data.cutoffPeriod?.start)} - ${formatDate(data.cutoffPeriod?.end)}
      </div>
    </div>

    <div class="section">
      <div class="section-title">EMPLOYEE INFORMATION</div>
      <div class="grid-2">
        <div>
          <span class="font-bold">Employee ID:</span> ${data.employeeId}
        </div>
        <div>
          <span class="font-bold">Name:</span> ${data.firstName} ${data.lastName}
        </div>
        <div>
          <span class="font-bold">Department:</span> ${data.departmentName || 'N/A'}
        </div>
        <div>
          <span class="font-bold">Position:</span> ${data.position || 'N/A'}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">EARNINGS</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Hours</th>
            <th class="text-right">Rate</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Basic Salary</td>
            <td class="text-right">${data.earnings?.regularHours || 160}</td>
            <td class="text-right">${formatCurrency((data.baseSalary || 0) / 160)}</td>
            <td class="text-right">${formatCurrency(data.earnings?.basicSalary || 0)}</td>
          </tr>
          ${data.earnings?.overtimePay > 0 ? `
          <tr>
            <td>Overtime Pay</td>
            <td class="text-right">${data.earnings.overtimeHours}</td>
            <td class="text-right">${formatCurrency((data.baseSalary / 160) * 1.25)}</td>
            <td class="text-right">${formatCurrency(data.earnings.overtimePay)}</td>
          </tr>
          ` : ''}
          <tr class="font-bold">
            <td colspan="3">Total Earnings</td>
            <td class="text-right">${formatCurrency(data.earnings?.totalEarnings || 0)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">DEDUCTIONS</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>SSS Contribution</td>
            <td class="text-right">${formatCurrency(data.deductions?.sss || 0)}</td>
          </tr>
          <tr>
            <td>Philhealth Contribution</td>
            <td class="text-right">${formatCurrency(data.deductions?.philhealth || 0)}</td>
          </tr>
          <tr>
            <td>Pagibig Contribution</td>
            <td class="text-right">${formatCurrency(data.deductions?.pagibig || 0)}</td>
          </tr>
          <tr>
            <td>Withholding Tax</td>
            <td class="text-right">${formatCurrency(data.deductions?.withholdingTax || 0)}</td>
          </tr>
          <tr class="font-bold">
            <td>Total Deductions</td>
            <td class="text-right">${formatCurrency(data.deductions?.totalDeductions || 0)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="border-2">
        <div class="row">
          <span class="font-bold text-lg">NET PAY</span>
          <span class="font-bold text-xl">${formatCurrency(data.netPay || 0)}</span>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Auto-print when loaded
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;
}
