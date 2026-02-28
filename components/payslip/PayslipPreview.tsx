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

interface PayslipPrintTemplateProps {
  data: any;
  ytdData?: any;
}

const PayslipPrintTemplate = forwardRef<HTMLDivElement, PayslipPrintTemplateProps>(
  ({ data, ytdData }, ref) => {
    return (
      <div
        ref={ref}
        className="print-container bg-white"
        style={{
          width: '210mm',
          boxSizing: 'border-box',
          fontSize: '12px',
          lineHeight: '1.4',
          backgroundColor: 'white',
          padding: '15mm'
        }}
      >
        <PdfTemplate1 data={data} ytdData={ytdData} />
      </div>
    );
  }
);

PayslipPrintTemplate.displayName = 'PayslipPrintTemplate';

interface PayslipPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  ytdData?: any;
}

export default function PayslipPreview({ isOpen, onClose, data, ytdData }: PayslipPreviewProps) {
  // const payslipRef = useRef<HTMLDivElement>(null);
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
      margin: 5mm; /* This creates a 5mm "Safe Zone" on all sides */
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

      // Generate and download PDF
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

  return (
    <>
    {/* 
      here letse implement using react pdf renderer
      following the exact desing of pft template 1, so that we generate download pdf without going to browser print
     */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          @page {
            size: A4;
            margin: 0;
          }

          body * {
            visibility: hidden;
          }
          
          .print-container, .print-container * {
            visibility: visible;
          }
          
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Payslip Preview</h2>

          <div className="space-y-4 pt-4">
            <div className="flex gap-2 justify-between items-center mb-4">
              <div className="text-sm text-gray-600">
                Choose download option:
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  disabled={isGenerating}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download PDF
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-auto bg-gray-50 p-4" style={{ maxHeight: '60vh' }}>
              {/* make the content scrollable */}
              <div className="flex justify-center">
                <div className="inline-block">
                  <PdfTemplate1 data={data} ytdData={ytdData} />
                </div>
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
    </>
  );
}