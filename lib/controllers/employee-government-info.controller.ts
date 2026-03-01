import { PrismaClient } from '@prisma/client';

export class EmployeeGovernmentInfoController {
  constructor(private prisma: PrismaClient) {}

  async getEmployeeGovernmentInfo(employeeId: string, organizationId: string) {
    const info = await this.prisma.employeeGovernmentInfo.findFirst({
      where: {
        employeeId,
        organizationId,
      },
    });

    if (!info) {
      throw new Error('Employee government information not found');
    }

    return info;
  }

  async createEmployeeGovernmentInfo(
    organizationId: string,
    data: {
      employeeId: string;
      sssNumber?: string;
      philhealthNumber?: string;
      pagibigNumber?: string;
      tinNumber?: string;
    }
  ) {
    // Verify employee exists and belongs to organization
    const employee = await this.prisma.employee.findFirst({
      where: {
        id: data.employeeId,
        organizationId,
      },
    });

    if (!employee) {
      throw new Error('Employee not found or does not belong to this organization');
    }

    // Check if government info already exists
    const existing = await this.prisma.employeeGovernmentInfo.findFirst({
      where: {
        employeeId: data.employeeId,
      },
    });

    if (existing) {
      throw new Error('Government information already exists for this employee');
    }

    return await this.prisma.employeeGovernmentInfo.create({
      data: {
        employeeId: data.employeeId,
        organizationId: organizationId,
        sssNumber: data.sssNumber || null,
        philhealthNumber: data.philhealthNumber || null,
        pagibigNumber: data.pagibigNumber || null,
        tinNumber: data.tinNumber || null,
      } as any,
    });
  }

  async updateEmployeeGovernmentInfo(
    id: string,
    organizationId: string,
    data: {
      sssNumber?: string;
      philhealthNumber?: string;
      pagibigNumber?: string;
      tinNumber?: string;
    }
  ) {
    const existing = await this.prisma.employeeGovernmentInfo.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existing) {
      throw new Error('Employee government information not found');
    }

    return await this.prisma.employeeGovernmentInfo.update({
      where: { id },
      data,
    });
  }

  async deleteEmployeeGovernmentInfo(id: string, organizationId: string) {
    const existing = await this.prisma.employeeGovernmentInfo.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existing) {
      throw new Error('Employee government information not found');
    }

    return await this.prisma.employeeGovernmentInfo.delete({
      where: { id },
    });
  }

  async getAllEmployeesGovernmentInfo(organizationId: string) {
    return await this.prisma.employeeGovernmentInfo.findMany({
      where: {
        organizationId,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
      },
    });
  }

  async searchEmployeesByGovernmentNumber(
    organizationId: string,
    searchType: 'sss' | 'philhealth' | 'pagibig' | 'tin',
    number: string
  ) {
    const whereClause: any = {
      organizationId,
    };

    switch (searchType) {
      case 'sss':
        whereClause.sssNumber = { contains: number, mode: 'insensitive' };
        break;
      case 'philhealth':
        whereClause.philhealthNumber = { contains: number, mode: 'insensitive' };
        break;
      case 'pagibig':
        whereClause.pagibigNumber = { contains: number, mode: 'insensitive' };
        break;
      case 'tin':
        whereClause.tinNumber = { contains: number, mode: 'insensitive' };
        break;
    }

    return await this.prisma.employeeGovernmentInfo.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            jobTitle: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async validateGovernmentNumbers(data: {
    sssNumber?: string;
    philhealthNumber?: string;
    pagibigNumber?: string;
    tinNumber?: string;
  }): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // SSS Number format: XX-XXXXXXXX-X (10 digits with dashes)
    if (data.sssNumber) {
      const sssPattern = /^\d{2}-\d{7}-\d{1}$/;
      if (!sssPattern.test(data.sssNumber)) {
        errors.push('SSS number must be in format: XX-XXXXXXXX-X (e.g., 01-2345678-9)');
      }
    }

    // Philhealth Number format: XX-XXXXXXXXXX-X (12 digits with dashes)
    if (data.philhealthNumber) {
      const philhealthPattern = /^\d{2}-\d{9}-\d{1}$/;
      if (!philhealthPattern.test(data.philhealthNumber)) {
        errors.push('Philhealth number must be in format: XX-XXXXXXXXXX-X (e.g., 12-345678901-2)');
      }
    }

    // Pagibig Number format: XXXX-XXXX-XXXX (12 digits with dashes)
    if (data.pagibigNumber) {
      const pagibigPattern = /^\d{4}-\d{4}-\d{4}$/;
      if (!pagibigPattern.test(data.pagibigNumber)) {
        errors.push('Pagibig number must be in format: XXXX-XXXX-XXXX (e.g., 1234-5678-9012)');
      }
    }

    // TIN Number format: XXX-XXX-XXX-XXX (12 digits with dashes)
    if (data.tinNumber) {
      const tinPattern = /^\d{3}-\d{3}-\d{3}-\d{3}$/;
      if (!tinPattern.test(data.tinNumber)) {
        errors.push('TIN must be in format: XXX-XXX-XXX-XXX (e.g., 123-456-789-000)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async bulkUpdateGovernmentInfo(
    organizationId: string,
    updates: Array<{
      employeeId: string;
      sssNumber?: string;
      philhealthNumber?: string;
      pagibigNumber?: string;
      tinNumber?: string;
    }>
  ) {
    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        // Validate government numbers
        const validation = await this.validateGovernmentNumbers(update);
        if (!validation.isValid) {
          errors.push({
            employeeId: update.employeeId,
            errors: validation.errors,
          });
          continue;
        }

        // Check if record exists
        const existing = await this.prisma.employeeGovernmentInfo.findFirst({
          where: {
            employeeId: update.employeeId,
            organizationId,
          },
        });

        if (existing) {
          // Update existing
          const updated = await this.prisma.employeeGovernmentInfo.update({
            where: { id: existing.id },
            data: update,
          });
          results.push(updated);
        } else {
          // Create new
          const created = await this.prisma.employeeGovernmentInfo.create({
            data: {
              employeeId: update.employeeId,
              organizationId: organizationId,
              sssNumber: update.sssNumber || null,
              philhealthNumber: update.philhealthNumber || null,
              pagibigNumber: update.pagibigNumber || null,
              tinNumber: update.tinNumber || null,
            } as any,
          });
          results.push(created);
        }
      } catch (error: any) {
        errors.push({
          employeeId: update.employeeId,
          error: error.message,
        });
      }
    }

    return {
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors,
    };
  }

  async exportGovernmentInfo(organizationId: string, format: 'csv' | 'excel' = 'csv') {
    const records = await this.prisma.employeeGovernmentInfo.findMany({
      where: {
        organizationId,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
            department: {
              select: {
                name: true,
              },
            },
            jobTitle: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Transform data for export
    const exportData = records.map(record => ({
      EmployeeID: record.employee.employeeId,
      FirstName: record.employee.firstName,
      LastName: record.employee.lastName,
      Email: record.employee.email,
      Department: record.employee.department?.name || '',
      JobTitle: record.employee.jobTitle?.name || '',
      SSSNumber: record.sssNumber || '',
      PhilhealthNumber: record.philhealthNumber || '',
      PagibigNumber: record.pagibigNumber || '',
      TIN: record.tinNumber || '',
    }));

    return {
      data: exportData,
      format,
      filename: `government-info-${new Date().toISOString().split('T')[0]}.${format}`,
    };
  }
}
