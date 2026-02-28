import React from "react";
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface PayslipData {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  departmentName?: string;
  position?: string;
  baseSalary: number;
  company: {
    id: string;
    name: string;
    email?: string;
    contactNumber?: string;
    address?: string;
    logo?: string;
    website?: string;
  };
  attendance: {
    presentDays: number;
    absentDays: number;
    lateDays: number;
    overtimeHours: number;
    lateMinutes: number;
    undertimeMinutes: number;
  };
  earnings: {
    basicSalary: number;
    overtimePay: number;
    holidayPay: number;
    nightDifferential: number;
    totalEarnings: number;
    regularHours: number;
    overtimeHours: number;
    nightDiffHours: number;
  };
  deductions: {
    sss: number;
    philhealth: number;
    pagibig: number;
    withholdingTax: number;
    lateDeduction: number;
    absenceDeduction: number;
    totalDeductions: number;
    governmentDeductions: number;
    policyDeductions: number;
  };
  netPay: number;
  status?: string;
  cutoffPeriod: {
    start: string;
    end: string;
  };
  workSchedule?: {
    monday: { start: string; end: string; };
    tuesday: { start: string; end: string; };
    wednesday: { start: string; end: string; };
    thursday: { start: string; end: string; };
    friday: { start: string; end: string; };
    saturday: { start: string; end: string; };
    sunday: { start: string; end: string; };
  };
  applicablePolicies?: {
    latePolicy: {
      type: string;
      deductionMethod: string;
      rate: number;
    };
    absencePolicy: {
      deductionMethod: string;
      rate: number;
    };
  };
}

export const PdfTemplate1 = React.forwardRef<HTMLDivElement, { data: PayslipData; ytdData?: any }>(({ data, ytdData }, ref) => {
  return (
    <div
      ref={ref}
      className="bg-white p-6 w-[210mm] mx-auto"
      style={{
        width: '210mm',
        height: '296mm', // 1mm shorter than A4 to be safe
        maxHeight: '296mm',// Force a hard stop
        boxSizing: 'border-box',
        overflow: 'hidden',// Prevents "ghost" overflow
        fontSize: '12px',
        lineHeight: '1.4',
        backgroundColor: 'white',
        padding: '10mm', // Reduced padding slightly
        position: 'relative'
      }} // A4 size with proper dimensions
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {data.company.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {data.company.address}
            </p>
            <p className="text-sm text-gray-600">
              {data.company.email} | {data.company.contactNumber}
            </p>
            {data.company.website && (
              <p className="text-sm text-gray-600">
                {data.company.website}
              </p>
            )}
          </div>
          {data.company.logo && (
            <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-xs text-gray-500">LOGO</span>
            </div>
          )}
        </div>

        <div className="border-t-2 border-b-2 border-gray-900 py-1">
          <h2 className="text-lg font-bold text-center text-gray-900">
            PAYSLIP
          </h2>
          <p className="text-center text-sm text-gray-600">
            For the period: {formatDate(data.cutoffPeriod.start)} - {formatDate(data.cutoffPeriod.end)}
          </p>
        </div>
      </div>

      {/* Employee Information */}
      <div className="mb-4">
        <h3 className="font-bold text-gray-900 mb-2">EMPLOYEE INFORMATION</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="py-1 w-1/4">
                <span className="font-semibold">Employee ID:</span>
              </td>
              <td className="py-1">{data.employeeId}</td>
              <td className="py-1 w-1/4">
                <span className="font-semibold">Name:</span>
              </td>
              <td className="py-1">{data.firstName} {data.lastName}</td>
            </tr>
            <tr>
              <td className="py-1">
                <span className="font-semibold">Department:</span>
              </td>
              <td className="py-1">{data.departmentName || 'N/A'}</td>
              <td className="py-1">
                <span className="font-semibold">Position:</span>
              </td>
              <td className="py-1">{data.position || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Attendance Summary */}
      <div className="mb-4">
        <h3 className="font-bold text-gray-900 mb-2">ATTENDANCE SUMMARY</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1">Type</th>
              <th className="text-left py-1 pl-4">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 font-semibold">Present</td>
              <td className="py-1 pl-4">{data.attendance.presentDays} days</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold">Absent</td>
              <td className="py-1 pl-4">{data.attendance.absentDays} days</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold">Late</td>
              <td className="py-1 pl-4">{data.attendance.lateMinutes} min</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Earnings */}
      <div className="mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-0.5">Earnings</th>
              <th className="text-right py-0.5">Hours</th>
              <th className="text-right py-0.5">Rate</th>
              <th className="text-right py-0.5">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-0.5">Basic Salary</td>
              <td className="text-right">{data.earnings.regularHours}</td>
              <td className="text-right">
                {formatCurrency(data.baseSalary / 160)}
              </td>
              <td className="text-right">
                {formatCurrency(data.earnings.basicSalary)}
              </td>
            </tr>
            {data.earnings.overtimePay > 0 && (
              <tr>
                <td className="py-0.5">Overtime Pay</td>
                <td className="text-right">{data.earnings.overtimeHours}</td>
                <td className="text-right">
                  {formatCurrency((data.baseSalary / 160) * 1.25)}
                </td>
                <td className="text-right">
                  {formatCurrency(data.earnings.overtimePay)}
                </td>
              </tr>
            )}
            {data.earnings.holidayPay > 0 && (
              <tr>
                <td className="py-0.5">Holiday Pay</td>
                <td className="text-right">-</td>
                <td className="text-right">-</td>
                <td className="text-right">
                  {formatCurrency(data.earnings.holidayPay)}
                </td>
              </tr>
            )}
            {data.earnings.nightDifferential > 0 && (
              <tr>
                <td className="py-0.5">Night Differential</td>
                <td className="text-right">{data.earnings.nightDiffHours}</td>
                <td className="text-right">
                  {formatCurrency((data.baseSalary / 160) * 0.1)}
                </td>
                <td className="text-right">
                  {formatCurrency(data.earnings.nightDifferential)}
                </td>
              </tr>
            )}
            <tr className="border-t font-bold">
              <td colSpan={3} className="py-1">
                Total Earnings
              </td>
              <td className="text-right">
                {formatCurrency(data.earnings.totalEarnings)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Deductions */}
      <div className="mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-0.5">Deductions</th>
              <th className="text-right py-0.5">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-0.5">SSS Contribution</td>
              <td className="text-right">
                {formatCurrency(data.deductions.sss)}
              </td>
            </tr>
            <tr>
              <td className="py-0.5">Philhealth Contribution</td>
              <td className="text-right">
                {formatCurrency(data.deductions.philhealth)}
              </td>
            </tr>
            <tr>
              <td className="py-0.5">Pagibig Contribution</td>
              <td className="text-right">
                {formatCurrency(data.deductions.pagibig)}
              </td>
            </tr>
            <tr>
              <td className="py-0.5">Withholding Tax</td>
              <td className="text-right">
                {formatCurrency(data.deductions.withholdingTax)}
              </td>
            </tr>
            {data.deductions.lateDeduction > 0 && (
              <tr>
                <td className="py-0.5">Late Deduction</td>
                <td className="text-right">
                  {formatCurrency(data.deductions.lateDeduction)}
                </td>
              </tr>
            )}
            {data.deductions.absenceDeduction > 0 && (
              <tr>
                <td className="py-0.5">Absence Deduction</td>
                <td className="text-right">
                  {formatCurrency(data.deductions.absenceDeduction)}
                </td>
              </tr>
            )}
            <tr className="border-t font-bold">
              <td className="py-0.5">Total Deductions</td>
              <td className="text-right">
                {formatCurrency(data.deductions.totalDeductions)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net Pay */}
      <div className="mb-4">
        <div className="border-2 border-gray-900 p-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">NET PAY</span>
            <span className="text-xl font-bold">
              {formatCurrency(data.netPay)}
            </span>
          </div>
        </div>
      </div>

      {/* YTD Summary */}
      {/* {ytdData && (
        <div className="mb-4">
          <h3 className="font-bold text-gray-900 mb-2">YEAR-TO-DATE SUMMARY</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">Gross Pay YTD:</span>{' '}
              {formatCurrency(ytdData.grossPay)}
            </div>
            <div>
              <span className="font-semibold">Deductions YTD:</span>{' '}
              {formatCurrency(ytdData.totalDeductions)}
            </div>
            <div>
              <span className="font-semibold">Net Pay YTD:</span>{' '}
              {formatCurrency(ytdData.netPay)}
            </div>
          </div>
        </div>
      )} */}

      {/* Footer */}
      <div className="mt-8 pt-4">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="text-center">
            <div className="border-b-2 mb-8 mt-4"></div>
            <p>Employee Signature</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 mb-8 mt-4"></div>
            <p>Verified By</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 mb-8 mt-4"></div>
            <p>Approved By</p>
          </div>
        </div>
        <p className="text-center text-xs text-gray-600 mt-4">
          This is a system-generated payslip. No signature required.
        </p>
      </div>
    </div>
  )
});

export const PDFTempalteDownloadable: React.FC<{ data: PayslipData }> = ({ data }) => {
  const formatTwoDecimals = (value: number): string => {
    return value.toFixed(2);
  };

  const styles = StyleSheet.create({
    page: {
      padding: '10mm',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: '#111827',
    },
    // Utility Classes
    bold: { fontWeight: 'bold' },
    textRight: { textAlign: 'right' },
    textCenter: { textAlign: 'center' },
    grayText: { color: '#4B5563', fontSize: 9 },

    // Layout Sections
    header: { marginBottom: 15 },
    companyInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    logoPlaceholder: {
      width: 60,
      height: 60,
      backgroundColor: '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 4,
    },
    titleBanner: {
      borderTopWidth: 2,
      borderBottomWidth: 2,
      borderColor: '#111827',
      paddingVertical: 4,
      marginVertical: 10,
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: 'bold',
      marginBottom: 6,
      marginTop: 10,
    },

    // Table Simulation
    table: { width: '100%' },
    row: { flexDirection: 'row', paddingVertical: 2 },
    headerRow: { borderBottomWidth: 1, borderBottomColor: '#111827', paddingBottom: 2, marginBottom: 2 },
    borderTop: { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 4, paddingTop: 2 },

    // Column Widths
    col25: { width: '25%' },
    col40: { width: '40%' },
    col20: { width: '20%' },
    col50: { width: '50%' },
    col80: { width: '80%' },

    // Net Pay Box
    netPayContainer: {
      borderWidth: 2,
      borderColor: '#111827',
      padding: 10,
      marginVertical: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    // Footer/Signatures
    signatureGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 40,
    },
    signatureBox: {
      width: '30%',
      alignItems: 'center',
    },
    signatureLine: {
      borderBottomWidth: 1,
      borderBottomColor: '#000',
      width: '100%',
      marginBottom: 4,
    }
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfoRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{data.company.name}</Text>
              <Text style={styles.grayText}>{data.company.address}</Text>
              <Text style={styles.grayText}>{data.company.email} | {data.company.contactNumber}</Text>
              {data.company.website && <Text style={styles.grayText}>{data.company.website}</Text>}
            </View>
            {data.company.logo && (
              <View style={styles.logoPlaceholder}>
                <Text style={{ fontSize: 8, color: '#9CA3AF' }}>LOGO</Text>
              </View>
            )}
          </View>

          <View style={styles.titleBanner}>
            <Text style={[styles.textCenter, styles.bold, { fontSize: 14 }]}>PAYSLIP</Text>
            <Text style={[styles.textCenter, styles.grayText]}>
              For the period: {formatDate(data.cutoffPeriod.start)} - {formatDate(data.cutoffPeriod.end)}
            </Text>
          </View>
        </View>

        {/* Employee Info */}
        <Text style={styles.sectionTitle}>EMPLOYEE INFORMATION</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.col25, styles.bold]}>Employee ID:</Text>
            <Text style={styles.col25}>{data.employeeId}</Text>
            <Text style={[styles.col25, styles.bold]}>Name:</Text>
            <Text style={styles.col25}>{data.firstName} {data.lastName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.col25, styles.bold]}>Department:</Text>
            <Text style={styles.col25}>{data.departmentName || 'N/A'}</Text>
            <Text style={[styles.col25, styles.bold]}>Position:</Text>
            <Text style={styles.col25}>{data.position || 'N/A'}</Text>
          </View>
        </View>

        {/* Attendance */}
        <View style={{ marginTop: 8 }}>
          <Text style={styles.sectionTitle}>ATTENDANCE SUMMARY</Text>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.col50, styles.bold]}>Type</Text>
            <Text style={[styles.col50, styles.bold]}>Value</Text>
          </View>
          <View style={styles.row}><Text style={styles.col50}>Present</Text><Text>{data.attendance.presentDays} days</Text></View>
          <View style={styles.row}><Text style={styles.col50}>Absent</Text><Text>{data.attendance.absentDays} days</Text></View>
          <View style={styles.row}><Text style={styles.col50}>Late</Text><Text>{data.attendance.lateMinutes} min</Text></View>
        </View>

        {/* Earnings */}
        <View style={{ marginTop: 10 }}>
          <Text style={styles.sectionTitle}>EARNINGS</Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.col40, styles.bold]}>Earnings</Text>
              <Text style={[styles.col20, styles.textRight, styles.bold]}>Hours</Text>
              <Text style={[styles.col20, styles.textRight, styles.bold]}>Rate</Text>
              <Text style={[styles.col20, styles.textRight, styles.bold]}>Amount</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.col40}>Basic Salary</Text>
              <Text style={[styles.col20, styles.textRight]}>{data.earnings.regularHours}</Text>
              <Text style={[styles.col20, styles.textRight]}>{formatTwoDecimals(data.baseSalary / 160)}</Text>
              <Text style={[styles.col20, styles.textRight, styles.bold]}>{formatTwoDecimals(data.earnings.basicSalary)}</Text>
            </View>
            {data.earnings.overtimePay > 0 && (
              <View style={styles.row}>
                <Text style={styles.col40}>Overtime Pay</Text>
                <Text style={[styles.col20, styles.textRight]}>{data.earnings.overtimeHours}</Text>
                <Text style={[styles.col20, styles.textRight]}>{formatTwoDecimals((data.baseSalary / 160) * 1.25)}</Text>
                <Text style={[styles.col20, styles.textRight, styles.bold]}>{formatTwoDecimals(data.earnings.overtimePay)}</Text>
              </View>
            )}
            {data.earnings.holidayPay > 0 && (
              <View style={styles.row}>
                <Text style={styles.col40}>Holiday Pay</Text>
                <Text style={[styles.col20, styles.textRight]}>-</Text>
                <Text style={[styles.col20, styles.textRight]}>-</Text>
                <Text style={[styles.col20, styles.textRight, styles.bold]}>{formatTwoDecimals(data.earnings.holidayPay)}</Text>
              </View>
            )}
            {data.earnings.nightDifferential > 0 && (
              <View style={styles.row}>
                <Text style={styles.col40}>Night Differential</Text>
                <Text style={[styles.col20, styles.textRight]}>{data.earnings.nightDiffHours}</Text>
                <Text style={[styles.col20, styles.textRight]}>{formatTwoDecimals((data.baseSalary / 160) * 0.1)}</Text>
                <Text style={[styles.col20, styles.textRight, styles.bold]}>{formatTwoDecimals(data.earnings.nightDifferential)}</Text>
              </View>
            )}
            {/* Total Earnings */}
            <View style={[styles.row, styles.borderTop]}>
              <Text style={[styles.col80, styles.bold]}>Total Earnings</Text>
              <Text style={[styles.col20, styles.textRight, styles.bold]}>{formatTwoDecimals(data.earnings.totalEarnings)}</Text>
            </View>
          </View>
        </View>

        {/* Deductions */}
        <View style={{ marginTop: 10 }}>
          <Text style={styles.sectionTitle}>DEDUCTIONS</Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.col80, styles.bold]}>Deductions</Text>
              <Text style={[styles.col20, styles.textRight, styles.bold]}>Amount</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.col80}>SSS Contribution</Text>
              <Text style={[styles.col20, styles.textRight]}>{formatTwoDecimals(data.deductions.sss)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.col80}>Philhealth</Text>
              <Text style={[styles.col20, styles.textRight]}>{formatTwoDecimals(data.deductions.philhealth)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.col80}>Pag-IBIG</Text>
              <Text style={[styles.col20, styles.textRight]}>{formatTwoDecimals(data.deductions.pagibig)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.col80}>Withholding Tax</Text>
              <Text style={[styles.col20, styles.textRight]}>{formatTwoDecimals(data.deductions.withholdingTax)}</Text>
            </View>
            {data.deductions.lateDeduction > 0 && (
              <View style={styles.row}>
                <Text style={styles.col80}>Late Deduction</Text>
                <Text style={[styles.col20, styles.textRight]}>{formatTwoDecimals(data.deductions.lateDeduction)}</Text>
              </View>
            )}
            {data.deductions.absenceDeduction > 0 && (
              <View style={styles.row}>
                <Text style={styles.col80}>Absence Deduction</Text>
                <Text style={[styles.col20, styles.textRight]}>{formatTwoDecimals(data.deductions.absenceDeduction)}</Text>
              </View>
            )}
            <View style={[styles.row, styles.borderTop]}>
              <Text style={[styles.col80, styles.bold]}>Total Deductions</Text>
              <Text style={[styles.col20, styles.textRight, styles.bold, { color: '#DC2626' }]}>{formatTwoDecimals(data.deductions.totalDeductions)}</Text>
            </View>
          </View>
        </View>

        {/* Net Pay */}
        <View style={{ marginTop: 12 }}>
          <View style={styles.netPayContainer}>
            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>NET PAY</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{formatTwoDecimals(data.netPay)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.signatureGrid}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8 }}>Employee Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8 }}>Verified By</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8 }}>Approved By</Text>
          </View>
        </View>
        <Text style={[styles.textCenter, styles.grayText, { marginTop: 20 }]}>
          This is a system-generated payslip. No signature required.
        </Text>
      </Page>
    </Document>
  );
}