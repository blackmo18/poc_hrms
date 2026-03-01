// PDF generation using browser's print-to-PDF capability
// This works without any external dependencies

export class BrowserPDFGenerator {
  private static instance: BrowserPDFGenerator;
  
  static getInstance(): BrowserPDFGenerator {
    if (!BrowserPDFGenerator.instance) {
      BrowserPDFGenerator.instance = new BrowserPDFGenerator();
    }
    return BrowserPDFGenerator.instance;
  }

  /**
   * Check if browser is Firefox
   */
  private isFirefox(): boolean {
    return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');
  }

  /**
   * Generate PDF using browser's print functionality
   */
  async generatePDF(element: HTMLElement, options: { filename?: string } = {}): Promise<void> {
    try {
      console.log('[PAYSLIP] Generating PDF using browser print...');

      // Get the HTML content
      const htmlContent = element.outerHTML;
      const filename = options.filename || 'payslip.pdf';

      // Method 1: Try opening new window first
      try {
        await this.openWindowMethod(htmlContent);
      } catch (error) {
        console.log('[PAYSLIP] Window method failed, trying iframe method...');
        await this.iframeMethod(htmlContent);
      }

      console.log('[PAYSLIP] Print dialog opened - choose "Save as PDF"');
    } catch (error) {
      console.error('[PAYSLIP] Error generating PDF:', error);
      throw new Error('Failed to generate PDF. Please check browser settings and allow popups.');
    }
  }

  /**
   * Method 1: Open in new window
   */
  private async openWindowMethod(htmlContent: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        reject(new Error('Popup blocked'));
        return;
      }

      printWindow.document.write(this.getPrintHTML(htmlContent));
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = () => {
            printWindow.close();
            resolve();
          };
          // Fallback
          setTimeout(() => {
            if (!printWindow.closed) {
              printWindow.close();
            }
            resolve();
          }, 1000);
        }, 500);
      };
    });
  }

  /**
   * Method 2: Use iframe
   */
  private async iframeMethod(htmlContent: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        reject(new Error('Could not access iframe document'));
        return;
      }

      iframeDoc.open();
      iframeDoc.write(this.getPrintHTML(htmlContent));
      iframeDoc.close();

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            resolve();
          }, 1000);
        }, 500);
      };
    });
  }

  /**
   * Get the full HTML for printing
   */
  private getPrintHTML(htmlContent: string): string {
    return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payslip</title>
            <style>
              /* Print styles - highest specificity */
              @page {
                size: A4;
                margin: 10mm;
              }
              
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                font-family: Arial, sans-serif !important;
                font-size: 12px !important;
                line-height: 1.4 !important;
                background: white !important;
              }
              
              /* Force all Tailwind classes */
              .bg-white {
                background-color: #ffffff !important;
                background: #ffffff !important;
              }
              
              .p-6 {
                padding: 24px !important;
              }
              
              .w-\\[210mm\\] {
                width: 210mm !important;
                max-width: 210mm !important;
                min-width: 210mm !important;
              }
              
              .h-\\[297mm\\] {
                height: 297mm !important;
                max-height: 297mm !important;
                min-height: 297mm !important;
              }
              
              .mx-auto {
                margin-left: auto !important;
                margin-right: auto !important;
              }
              
              .mb-4 {
                margin-bottom: 16px !important;
              }
              
              .mb-3 {
                margin-bottom: 12px !important;
              }
              
              .mb-2 {
                margin-bottom: 8px !important;
              }
              
              .flex {
                display: flex !important;
              }
              
              .items-start {
                align-items: flex-start !important;
              }
              
              .justify-between {
                justify-content: space-between !important;
              }
              
              .flex-1 {
                flex: 1 !important;
              }
              
              .text-xl {
                font-size: 1.25rem !important;
                font-weight: 600 !important;
              }
              
              .text-lg {
                font-size: 1.125rem !important;
                font-weight: 600 !important;
              }
              
              .font-bold {
                font-weight: 700 !important;
              }
              
              .text-center {
                text-align: center !important;
              }
              
              .text-sm {
                font-size: 0.875rem !important;
              }
              
              .text-gray-900 {
                color: #111827 !important;
              }
              
              .text-gray-600 {
                color: #4b5563 !important;
              }
              
              .border-t-2 {
                border-top: 2px solid #000000 !important;
              }
              
              .border-b-2 {
                border-bottom: 2px solid #000000 !important;
              }
              
              .border-gray-900 {
                border-color: #111827 !important;
              }
              
              .py-1 {
                padding-top: 4px !important;
                padding-bottom: 4px !important;
              }
              
              .grid {
                display: grid !important;
              }
              
              .grid-cols-2 {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              }
              
              .grid-cols-3 {
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              }
              
              .gap-4 {
                gap: 16px !important;
              }
              
              .w-full {
                width: 100% !important;
              }
              
              .border-b {
                border-bottom: 1px solid #000000 !important;
              }
              
              .text-right {
                text-align: right !important;
              }
              
              .border-2 {
                border: 2px solid #000000 !important;
              }
              
              .overflow-hidden {
                overflow: hidden !important;
              }
              
              /* Table styles */
              table {
                border-collapse: collapse !important;
                width: 100% !important;
              }
              
              th, td {
                padding: 4px !important;
                text-align: left !important;
                vertical-align: top !important;
              }
              
              th {
                font-weight: 600 !important;
                border-bottom: 1px solid #000000 !important;
              }
              
              /* Print specific */
              @media print {
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                
                .no-print {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body>
            ${htmlContent}
            <script>
              // Ensure styles are applied before printing
              window.onload = function() {
                // Force style recalculation
                document.body.offsetHeight;
                setTimeout(() => {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `;
  }

  /**
   * Alternative method: Create a downloadable HTML file that can be printed to PDF
   */
  async downloadPrintableHTML(element: HTMLElement, filename: string): Promise<void> {
    try {
      console.log('[PAYSLIP] Creating printable HTML file...');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payslip - ${filename}</title>
            <style>
              /* Print styles - highest specificity */
              @page {
                size: A4;
                margin: 10mm;
              }
              
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              html, body {
                margin: 0 !important;
                padding: 20px !important;
                font-family: Arial, sans-serif !important;
                font-size: 12px !important;
                line-height: 1.4 !important;
                background: white !important;
                display: flex !important;
                justify-content: center !important;
              }
              
              /* Force all Tailwind classes */
              .bg-white {
                background-color: #ffffff !important;
                background: #ffffff !important;
              }
              
              .p-6 {
                padding: 24px !important;
              }
              
              .w-\\[210mm\\] {
                width: 210mm !important;
                max-width: 210mm !important;
                min-width: 210mm !important;
              }
              
              .h-\\[297mm\\] {
                height: 297mm !important;
                max-height: 297mm !important;
                min-height: 297mm !important;
              }
              
              .mx-auto {
                margin-left: auto !important;
                margin-right: auto !important;
              }
              
              .mb-4 {
                margin-bottom: 16px !important;
              }
              
              .mb-3 {
                margin-bottom: 12px !important;
              }
              
              .mb-2 {
                margin-bottom: 8px !important;
              }
              
              .flex {
                display: flex !important;
              }
              
              .items-start {
                align-items: flex-start !important;
              }
              
              .justify-between {
                justify-content: space-between !important;
              }
              
              .flex-1 {
                flex: 1 !important;
              }
              
              .text-xl {
                font-size: 1.25rem !important;
                font-weight: 600 !important;
              }
              
              .text-lg {
                font-size: 1.125rem !important;
                font-weight: 600 !important;
              }
              
              .font-bold {
                font-weight: 700 !important;
              }
              
              .text-center {
                text-align: center !important;
              }
              
              .text-sm {
                font-size: 0.875rem !important;
              }
              
              .text-gray-900 {
                color: #111827 !important;
              }
              
              .text-gray-600 {
                color: #4b5563 !important;
              }
              
              .border-t-2 {
                border-top: 2px solid #000000 !important;
              }
              
              .border-b-2 {
                border-bottom: 2px solid #000000 !important;
              }
              
              .border-gray-900 {
                border-color: #111827 !important;
              }
              
              .py-1 {
                padding-top: 4px !important;
                padding-bottom: 4px !important;
              }
              
              .grid {
                display: grid !important;
              }
              
              .grid-cols-2 {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              }
              
              .grid-cols-3 {
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              }
              
              .gap-4 {
                gap: 16px !important;
              }
              
              .w-full {
                width: 100% !important;
              }
              
              .border-b {
                border-bottom: 1px solid #000000 !important;
              }
              
              .text-right {
                text-align: right !important;
              }
              
              .border-2 {
                border: 2px solid #000000 !important;
              }
              
              .overflow-hidden {
                overflow: hidden !important;
              }
              
              /* Table styles */
              table {
                border-collapse: collapse !important;
                width: 100% !important;
              }
              
              th, td {
                padding: 4px !important;
                text-align: left !important;
                vertical-align: top !important;
              }
              
              th {
                font-weight: 600 !important;
                border-bottom: 1px solid #000000 !important;
              }
              
              /* Print specific */
              @media print {
                body {
                  margin: 0 !important;
                  padding: 0 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                
                .w-\\[210mm\\] {
                  width: 210mm !important;
                  margin: 0 auto !important;
                }
              }
            </style>
          </head>
          <body>
            ${element.outerHTML}
          </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.replace('.pdf', '.html');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`[PAYSLIP] Printable HTML saved: ${filename.replace('.pdf', '.html')}`);
      console.log('[PAYSLIP] Open the HTML file in browser and print to PDF');
    } catch (error) {
      console.error('[PAYSLIP] Error creating HTML file:', error);
      throw new Error('Failed to create printable HTML file.');
    }
  }
}

export const browserPDFGenerator = BrowserPDFGenerator.getInstance();
