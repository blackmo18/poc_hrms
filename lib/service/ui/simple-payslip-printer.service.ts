// Simple PDF generation using browser's print functionality
// This works without any external dependencies

export class SimplePayslipPrinter {
  private static instance: SimplePayslipPrinter;
  
  static getInstance(): SimplePayslipPrinter {
    if (!SimplePayslipPrinter.instance) {
      SimplePayslipPrinter.instance = new SimplePayslipPrinter();
    }
    return SimplePayslipPrinter.instance;
  }

  /**
   * Print payslip using browser's print functionality
   */
  async printPayslip(element: HTMLElement): Promise<void> {
    try {
      console.log('[PAYSLIP] Opening print dialog...');

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window. Please allow popups.');
      }

      // Get the HTML content
      const htmlContent = element.outerHTML;

      // Write the payslip HTML to the new window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payslip</title>
            <style>
              @page {
                size: A4;
                margin: 10mm;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
              }
              /* Hide scrollbars in print */
              @media print {
                body { 
                  overflow: hidden;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
              /* Ensure proper sizing */
              .payslip-container {
                width: 190mm;
                min-height: 277mm;
                margin: 0 auto;
                box-sizing: border-box;
                overflow: hidden;
              }
            </style>
          </head>
          <body>
            ${htmlContent}
            <script>
              // Trigger print dialog when page loads
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
    } catch (error) {
      console.error('[PAYSLIP] Error printing payslip:', error);
      throw new Error('Failed to print payslip');
    }
  }

  /**
   * Save as HTML file (can be opened in browser and printed to PDF)
   */
  async saveAsHTML(element: HTMLElement, filename: string): Promise<void> {
    try {
      console.log('[PAYSLIP] Saving as HTML...');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payslip</title>
            <style>
              @page {
                size: A4;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
              }
              .payslip-container {
                width: 595px;
                min-height: 842px;
                box-sizing: border-box;
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

      console.log(`[PAYSLIP] HTML saved: ${filename.replace('.pdf', '.html')}`);
    } catch (error) {
      console.error('[PAYSLIP] Error saving HTML:', error);
      throw new Error('Failed to save payslip as HTML');
    }
  }
}

export const simplePayslipPrinter = SimplePayslipPrinter.getInstance();
