import React from 'react';
import { pdf } from '@react-pdf/renderer';
import PayslipPDF from '@/components/payslip/PayslipPDF';

class ReactPDFService {
  private static instance: ReactPDFService;
  
  static getInstance(): ReactPDFService {
    if (!ReactPDFService.instance) {
      ReactPDFService.instance = new ReactPDFService();
    }
    return ReactPDFService.instance;
  }

  /**
   * Generate and automatically download PDF
   */
  async downloadPDF(data: any, ytdData?: any): Promise<void> {
    try {
      console.log('[PDF] Generating PDF using React-PDF...');
      
      // Create the PDF document
      const doc = <PayslipPDF data={data} ytdData={ytdData} />;
      
      // Generate PDF blob
      const blob = await pdf(doc).toBlob();
      
      // Create download URL
      const url = URL.createObjectURL(blob);
      
      // Create filename
      const filename = `payslip-${data.employeeId}-${data.cutoffPeriod.start.replace(/-/g, '')}.pdf`;
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL
      URL.revokeObjectURL(url);
      
      console.log('[PDF] PDF downloaded successfully');
    } catch (error) {
      console.error('[PDF] Failed to generate PDF:', error);
      throw error;
    }
  }

  /**
   * Generate PDF and open in new tab
   */
  async openInNewTab(data: any, ytdData?: any): Promise<void> {
    try {
      console.log('[PDF] Generating PDF for preview...');
      
      // Create the PDF document
      const doc = <PayslipPDF data={data} ytdData={ytdData} />;
      
      // Generate PDF blob
      const blob = await pdf(doc).toBlob();
      
      // Create URL
      const url = URL.createObjectURL(blob);
      
      // Open in new tab
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        throw new Error('Failed to open preview. Please allow popups for this site.');
      }
      
      console.log('[PDF] PDF opened in new tab');
    } catch (error) {
      console.error('[PDF] Failed to open PDF:', error);
      throw error;
    }
  }

  /**
   * Generate PDF as base64 (for sending to server, etc.)
   */
  async toBase64(data: any, ytdData?: any): Promise<string> {
    try {
      console.log('[PDF] Converting PDF to base64...');
      
      // Create the PDF document
      const doc = <PayslipPDF data={data} ytdData={ytdData} />;
      
      // Generate PDF as blob then convert to base64
      const blob = await pdf(doc).toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to base64
      const base64 = btoa(String.fromCharCode(...uint8Array));
      
      return base64;
    } catch (error) {
      console.error('[PDF] Failed to convert to base64:', error);
      throw error;
    }
  }
}

export const reactPDFService = ReactPDFService.getInstance();
