import { compensationController } from '@/lib/controllers/compensation.controller';
import { CreateCompensation, UpdateCompensation } from '../models/compensation';
import { Compensation } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export class CompensationService {
  async getById(id: string): Promise<Compensation | null> {
    return await compensationController.getById(id);
  }

  async getByEmployeeId(employeeId: string): Promise<Compensation[]> {
    return await compensationController.findByEmployeeId(employeeId);
  }

  async getAll(): Promise<Compensation[]> {
    return await compensationController.getAll();
  }

  async create(data: CreateCompensation): Promise<Compensation> {
    return await compensationController.create(data);
  }

  async update(id: string, data: UpdateCompensation): Promise<Compensation> {
    return await compensationController.update(id, data);
  }

  async delete(id: string): Promise<Compensation> {
    return await compensationController.delete(id);
  }

  async getCurrentCompensation(employeeId: string): Promise<Compensation | null> {
    const compensations = await this.getByEmployeeId(employeeId);
    
    // Sort by effective date descending and get the most recent
    compensations.sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    
    return compensations[0] || null;
  }

  async calculateGrossPay(employeeId: string, periodStart: Date, periodEnd: Date): Promise<number> {
    const currentCompensation = await this.getCurrentCompensation(employeeId);
    
    if (!currentCompensation) {
      throw new Error('No compensation record found for employee');
    }

    const { baseSalary, payFrequency } = currentCompensation;
    
    // Calculate proration if needed
    const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysInMonth = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0).getDate();
    const prorationFactor = daysInPeriod / daysInMonth;

    // Adjust base salary based on pay frequency
    let grossPay = baseSalary;
    
    switch (payFrequency) {
      case 'MONTHLY':
        grossPay = baseSalary * prorationFactor;
        break;
      case 'SEMI_MONTHLY':
        grossPay = (baseSalary / 2) * prorationFactor;
        break;
      case 'BI_WEEKLY':
        grossPay = (baseSalary / 2) * prorationFactor; // Approximate
        break;
      case 'WEEKLY':
        grossPay = (baseSalary / 4) * prorationFactor; // Approximate
        break;
    }

    return Math.round(grossPay * 100) / 100; // Round to 2 decimal places
  }

  async getCompensationHistory(employeeId: string): Promise<Compensation[]> {
    const compensations = await this.getByEmployeeId(employeeId);
    
    // Sort by effective date ascending for history
    compensations.sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime());
    
    return compensations;
  }

  async updateCompensation(id: string, data: UpdateCompensation, reason?: string): Promise<Compensation> {
    // Log the update for audit purposes
    console.log(`[COMPENSATION] Update for ${id}: ${JSON.stringify({
      reason: reason || 'No reason provided',
      timestamp: new Date(),
    })}`);

    return await this.update(id, data);
  }
}

let compensationService: CompensationService;

export function getCompensationService(): CompensationService {
  if (!compensationService) {
    compensationService = new CompensationService();
  }
  return compensationService;
}
