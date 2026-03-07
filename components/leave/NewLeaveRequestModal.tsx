'use client';

import { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import Button from '../ui/button/Button';
import DatePicker from '../form/date-picker';
import Select from '../form/Select';
import TextArea from '../form/input/TextArea';
import Label from '../form/Label';

interface LeaveFormData {
  leaveType: string;
  startDate: string;
  endDate: string;
  remarks: string;
}

interface ValidationErrors {
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  dateRange?: string;
}

interface NewLeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeaveFormData) => Promise<void>;
  submitting: boolean;
}

const leaveTypeOptions = [
  { value: 'VACATION', label: 'Vacation Leave' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'EMERGENCY', label: 'Emergency Leave' },
  { value: 'MATERNITY', label: 'Maternity Leave' },
  { value: 'PATERNITY', label: 'Paternity Leave' },
  { value: 'BEREAVEMENT', label: 'Bereavement Leave' },
  { value: 'UNPAID', label: 'Unpaid Leave' },
];

export default function NewLeaveRequestModal({ isOpen, onClose, onSubmit, submitting }: NewLeaveRequestModalProps) {
  const [formData, setFormData] = useState<LeaveFormData>({
    leaveType: 'VACATION',
    startDate: '',
    endDate: '',
    remarks: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        leaveType: 'VACATION',
        startDate: '',
        endDate: '',
        remarks: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validate leave type
    if (!formData.leaveType) {
      newErrors.leaveType = 'Please select a leave type';
    }

    // Validate start date
    if (!formData.startDate) {
      newErrors.startDate = 'Please select a start date';
    }

    // Validate end date
    if (!formData.endDate) {
      newErrors.endDate = 'Please select an end date';
    }

    // Validate date range
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        newErrors.dateRange = 'Start date cannot be in the past';
      } else if (end < start) {
        newErrors.dateRange = 'End date must be after start date';
      } else {
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (daysDiff > 365) {
          newErrors.dateRange = 'Leave duration cannot exceed 365 days';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Trigger the confirmation modal by calling onSubmit with the form data
      onSubmit(formData);
    }
  };

  const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleStartDateChange = (selectedDates: any) => {
    if (selectedDates && selectedDates.length > 0) {
      const date = selectedDates[0] as Date;
      const formattedDate = date.toISOString().split('T')[0];
      setFormData({ ...formData, startDate: formattedDate });
      
      // Reset end date if it's before new start date
      if (formData.endDate && formattedDate > formData.endDate) {
        setFormData(prev => ({ ...prev, startDate: formattedDate, endDate: '' }));
      }
      
      // Clear errors when user makes a selection
      if (errors.startDate || errors.dateRange) {
        setErrors({ ...errors, startDate: undefined, dateRange: undefined });
      }
    }
  };

  const handleEndDateChange = (selectedDates: any) => {
    if (selectedDates && selectedDates.length > 0) {
      const date = selectedDates[0] as Date;
      const formattedDate = date.toISOString().split('T')[0];
      setFormData({ ...formData, endDate: formattedDate });
      
      // Clear errors when user makes a selection
      if (errors.endDate || errors.dateRange) {
        setErrors({ ...errors, endDate: undefined, dateRange: undefined });
      }
    }
  };

  const handleLeaveTypeChange = (value: string) => {
    setFormData({ ...formData, leaveType: value });
    // Clear error when user makes a selection
    if (errors.leaveType) {
      setErrors({ ...errors, leaveType: undefined });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[500px] m-4"
    >
      <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            File New Leave Request
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Submit a new leave request for approval
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="px-2">
            <div className="mb-4">
              <Label htmlFor="leave-type">Leave Type</Label>
              <Select
                options={leaveTypeOptions}
                value={formData.leaveType}
                onChange={handleLeaveTypeChange}
                placeholder="Select leave type"
                required
              />
              {errors.leaveType && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.leaveType}</p>
              )}
            </div>

            <div className="mb-4">
              <DatePicker
                id="start-date"
                label="Start Date"
                placeholder="Select start date"
                onChange={handleStartDateChange}
                defaultDate={formData.startDate || undefined}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.startDate}</p>
              )}
            </div>

            <div className="mb-4">
              <DatePicker
                id="end-date"
                label="End Date"
                placeholder="Select end date"
                onChange={handleEndDateChange}
                defaultDate={formData.endDate || undefined}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.endDate}</p>
              )}
              {errors.dateRange && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.dateRange}</p>
              )}
              {formData.startDate && formData.endDate && !errors.dateRange && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Duration: {calculateDays(formData.startDate, formData.endDate)} days
                </p>
              )}
            </div>

            <div className="mb-6">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <TextArea
                value={formData.remarks}
                onChange={(value) => setFormData({ ...formData, remarks: value })}
                rows={3}
                placeholder="Please provide a reason for your leave request..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Review Request
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
