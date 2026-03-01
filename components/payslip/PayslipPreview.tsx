'use client';

import React, { useRef, useState, forwardRef } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import { Download, Loader2, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { pdf } from '@react-pdf/renderer';
import { PDFTempalteDownloadable, PdfTemplate1 } from './PdfTemplates';

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
}

interface PayslipPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  data: PayslipData;
  ytdData?: any;
}

const PayslipPrintTemplate = forwardRef<HTMLDivElement, { data: PayslipData; ytdData?: any }>(({ data, ytdData }, ref) => {
  return (
    <div ref={ref} className="bg-white p-8 print-container">
      <div className="border-2 border-gray-300 p-6">
        <h1 className="text-2xl font-bold text-center mb-6">PAYSLIP</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p><strong>Employee Name:</strong> {data.firstName} {data.lastName}</p>
            <p><strong>Employee ID:</strong> {data.employeeId}</p>
            <p><strong>Department:</strong> {data.departmentName || 'N/A'}</p>
            <p><strong>Position:</strong> {data.position || 'N/A'}</p>
          </div>
          <div>
            <p><strong>Pay Period:</strong> {formatDate(data.cutoffPeriod.start)} - {formatDate(data.cutoffPeriod.end)}</p>
            <p><strong>Basic Salary:</strong> {formatCurrency(data.baseSalary)}</p>
            <p><strong>Total Earnings:</strong> {formatCurrency(data.earnings.totalEarnings)}</p>
            <p><strong>Total Deductions:</strong> {formatCurrency(data.deductions.totalDeductions)}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-2">Earnings</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Description</th>
                <th className="text-right p-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2">Basic Salary</td>
                <td className="text-right p-2">{formatCurrency(data.earnings.basicSalary)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">Overtime Pay</td>
                <td className="text-right p-2">{formatCurrency(data.earnings.overtimePay)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">Holiday Pay</td>
                <td className="text-right p-2">{formatCurrency(data.earnings.holidayPay)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">Night Differential</td>
                <td className="text-right p-2">{formatCurrency(data.earnings.nightDifferential)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-2">Deductions</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Description</th>
                <th className="text-right p-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2">SSS</td>
                <td className="text-right p-2">{formatCurrency(data.deductions.sss)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">PhilHealth</td>
                <td className="text-right p-2">{formatCurrency(data.deductions.philhealth)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">Pag-IBIG</td>
                <td className="text-right p-2">{formatCurrency(data.deductions.pagibig)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">Withholding Tax</td>
                <td className="text-right p-2">{formatCurrency(data.deductions.withholdingTax)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">Late Deduction</td>
                <td className="text-right p-2">{formatCurrency(data.deductions.lateDeduction)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">Absence Deduction</td>
                <td className="text-right p-2">{formatCurrency(data.deductions.absenceDeduction)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-right">
          <p className="text-xl font-bold">Net Pay: {formatCurrency(data.netPay)}</p>
        </div>
      </div>
    </div>
  );
});

PayslipPrintTemplate.displayName = 'PayslipPrintTemplate';

export default function PayslipPreview({ isOpen, onClose, data, ytdData }: PayslipPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Payslip_${data.employeeId}_${data.lastName}`,
    onBeforePrint: async () => {
      setIsGenerating(true);
    },
    onAfterPrint: () => {
      setIsGenerating(false);
    },
    pageStyle: `
      @page {
        size: A4;
        margin: 5mm;
      }
      @media print {
        html, body {
          height: auto;
          overflow: visible !important;
        }
        .print-container {
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `,
  });

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(<PDFTempalteDownloadable data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip_${data.employeeId}_${data.cutoffPeriod.start}_${data.cutoffPeriod.end}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Payslip Preview</h2>

        <div className="space-y-4 pt-4">
          <div className="flex gap-2 justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              Choose download option:
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-medium">Preview</h3>
            </div>
            <div className="p-4 bg-white">
              <PdfTemplate1 data={data} ytdData={ytdData} />
            </div>
          </div>

          <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
            <PayslipPrintTemplate
              ref={printRef}
              data={data}
              ytdData={ytdData}
            />
          </div>

          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>For best PDF quality:</p>
            <p>Use Chrome/Edge browser (recommended)</p>
            <p>Enable "Background graphics" in print settings</p>
            <p>In print dialog, choose "Save as PDF"</p>
            <p>Ensure popups are allowed for this site</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
