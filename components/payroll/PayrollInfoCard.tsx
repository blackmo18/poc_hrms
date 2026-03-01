import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import { CalendarDays, Building2, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PayrollInfoCardProps {
  employeeName: string;
  employeeId: string; // Employee code/ID (not database ID)
  organizationName: string;
  payrollPeriod: {
    start: string;
    end: string;
  };
  payrollStatus?: string; // Made optional and more flexible
  className?: string;
}

const statusConfig = {
  PENDING: {
    icon: Clock,
    label: 'Pending',
    color: 'warning' as const
  },
  PROCESSING: {
    icon: AlertCircle,
    label: 'Processing',
    color: 'info' as const
  },
  COMPLETED: {
    icon: CheckCircle,
    label: 'Completed',
    color: 'success' as const
  },
  FAILED: {
    icon: XCircle,
    label: 'Failed',
    color: 'error' as const
  },
  CANCELLED: {
    icon: XCircle,
    label: 'Cancelled',
    color: 'dark' as const
  }
};

export function PayrollInfoCard({
  employeeName,
  employeeId,
  organizationName,
  payrollPeriod,
  payrollStatus = 'PENDING', // Default value
  className
}: PayrollInfoCardProps) {
  const status = statusConfig[payrollStatus as keyof typeof statusConfig] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Payroll Information</h3>
          <Badge 
            color={status.color} 
            variant="light"
            startIcon={<StatusIcon className="w-3 h-3" />}
          >
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Employee Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">{employeeName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ml-6">
            <span className="font-medium">Employee ID:</span>
            <span>{employeeId}</span>
          </div>
        </div>

        {/* Organization */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{organizationName}</span>
        </div>

        {/* Payroll Period */}
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            {formatDate(payrollPeriod.start)} - {formatDate(payrollPeriod.end)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Default export for easier importing
export default PayrollInfoCard;
