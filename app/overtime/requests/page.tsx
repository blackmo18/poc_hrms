'use client';

import { useState, useEffect } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import PageMeta from '@/components/common/PageMeta';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import DatePicker from '@/components/form/date-picker';
import TimeEntrySelectionModal from '@/components/overtime/TimeEntrySelectionModal';
import TimeInput from '@/components/form/input/TimeInput';
import DetailsConfirmationModal from '@/components/ui/modal/DetailsConfirmationModal';
import { AlertCircleIcon, CheckCircleIcon, CalendarIcon } from 'lucide-react';
import OvertimeStatusCards from '@/components/overtime/OvertimeStatusCards';

export default function OTRequestPage() {
  const [formData, setFormData] = useState({
    workDate: '',
    timeEntryId: '',
    timeStart: '',
    timeEnd: '',
    reason: '',
    otType: '',
    remarks: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false);
  const [selectedTimeEntryDisplay, setSelectedTimeEntryDisplay] = useState<{ date: string; time: string } | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    pendingRequests: 0,
    approvedThisMonth: 0,
    totalApprovedHours: 0,
  });

  useEffect(() => {
    fetchOvertimeStats();
  }, []);

  const fetchOvertimeStats = async () => {
    try {
      const response = await fetch('/api/overtime-requests', {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Failed to fetch overtime stats');
        return;
      }

      const data = await response.json();
      const records: Array<{
        status: string;
        workDate: string;
        approvedMinutes: number | null;
      }> = data.data || [];

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      const stats = records.reduce(
        (acc, record) => {
          if (record.status === 'PENDING') {
            acc.pendingRequests++;
          } else if (record.status === 'APPROVED') {
            // Check if workDate is in current month
            const recordMonth = record.workDate.slice(0, 7);
            if (recordMonth === currentMonth) {
              acc.approvedThisMonth++;
            }
            // Add approved minutes to total
            if (record.approvedMinutes) {
              acc.totalApprovedHours += record.approvedMinutes;
            }
          }
          return acc;
        },
        { pendingRequests: 0, approvedThisMonth: 0, totalApprovedHours: 0 }
      );

      setStats(stats);
    } catch (error) {
      console.error('Error fetching overtime stats:', error);
    }
  };

  const otTypeOptions = [
    { value: 'REGULAR_DAY', label: 'Regular Day Overtime' },
    { value: 'REST_DAY', label: 'Rest Day Overtime' },
    { value: 'EMERGENCY', label: 'Emergency Overtime' },
    { value: 'SPECIAL_HOLIDAY', label: 'Special Holiday Overtime' },
    { value: 'REGULAR_HOLIDAY', label: 'Regular Holiday Overtime' },
  ];

  const isRelatedTimeEntryRequired = () => {
    return formData.otType && formData.otType !== 'EMERGENCY' && formData.otType !== 'SPECIAL_HOLIDAY' && formData.otType !== 'REST_DAY';
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.workDate) {
      newErrors.workDate = 'Work date is required';
    }

    if (!formData.otType) {
      newErrors.otType = 'OT Type is required';
    }

    if (isRelatedTimeEntryRequired() && !formData.timeEntryId) {
      newErrors.timeEntryId = 'Related time entry is required for this OT type';
    }

    if (!formData.timeStart) {
      newErrors.timeStart = 'Time start is required';
    }

    if (!formData.timeEnd) {
      newErrors.timeEnd = 'Time end is required';
    }

    if (formData.timeStart && formData.timeEnd && formData.timeStart >= formData.timeEnd) {
      newErrors.timeEnd = 'Time end must be after time start';
    }

    if (!formData.reason) {
      newErrors.reason = 'Reason/Justification is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setShowValidationModal(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      const response = await fetch('/api/overtime-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workDate: formData.workDate,
          timeEntryId: formData.timeEntryId || null,
          timeStart: formData.timeStart,
          timeEnd: formData.timeEnd,
          reason: formData.reason,
          otType: formData.otType,
          remarks: formData.remarks,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        console.log('OT request submitted successfully');
        setSubmitStatus('success');
        setShowValidationModal(false);

        setTimeout(() => {
          setFormData({
            workDate: '',
            timeEntryId: '',
            timeStart: '',
            timeEnd: '',
            reason: '',
            otType: '',
            remarks: '',
          });
          setSubmitStatus('idle');
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to submit OT request:', errorData);
        setSubmitStatus('error');
        setShowValidationModal(false);
      }
    } catch (error) {
      console.error('Error submitting OT request:', error);
      setSubmitStatus('error');
      setShowValidationModal(false);
    }
  };

  return (
    <>
      <PageMeta title="Overtime Requests - HR Management System" description="File and manage your overtime requests" />
      <PageBreadcrumb
        pageTitle="Overtime Requests"
        breadcrumbs={[
          { label: 'Overtime' },
          { label: 'Requests' }
        ]}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Status Cards - Top Most */}
          <OvertimeStatusCards
            pendingRequests={stats.pendingRequests}
            approvedThisMonth={stats.approvedThisMonth}
            totalApprovedHours={stats.totalApprovedHours}
          />

          {/* OT Filing Form Section */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                File Overtime Request
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Submit your overtime request for approval. All required fields must be completed.
              </p>
            </div>

            {/* Success Message */}
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg dark:bg-success-900/20 dark:border-success-800 flex items-center gap-3">
                <CheckCircleIcon className="w-5 h-5 text-success-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-success-900 dark:text-success-100 text-sm">
                    Overtime request submitted successfully!
                  </p>
                  <p className="text-xs text-success-800 dark:text-success-200">
                    Your request is now pending approval. You will be notified once it's reviewed.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:border-error-800 flex items-center gap-3">
                <AlertCircleIcon className="w-5 h-5 text-error-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-error-900 dark:text-error-100 text-sm">
                    Error submitting overtime request
                  </p>
                  <p className="text-xs text-error-800 dark:text-error-200">
                    Please try again or contact HR if the problem persists.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Required Fields Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Required Information
                </h3>
                <div className="space-y-4">
                  {/* Work Date */}
                  <div>
                    <DatePicker
                      id="workDate"
                      label="Work Date *"
                      mode="single"
                      placeholder="Select work date"
                      onChange={(dates) => {
                        if (dates && dates.length > 0) {
                          const dateStr = dates[0].toISOString().split('T')[0];
                          handleInputChange('workDate', dateStr);
                        }
                      }}
                    />
                    {errors.workDate && (
                      <p className="mt-1 text-xs text-error-500">{errors.workDate}</p>
                    )}
                  </div>

                  {/* OT Type */}
                  <div>
                    <Label htmlFor="otType">OT Type *</Label>
                    <Select
                      options={otTypeOptions}
                      placeholder="Select OT type"
                      value={formData.otType}
                      onChange={(value) => handleInputChange('otType', value)}
                    />
                    {errors.otType && (
                      <p className="mt-1 text-xs text-error-500">{errors.otType}</p>
                    )}
                  </div>

                  {/* Related Time Entry - Modal Button */}
                  {formData.otType && (
                    <div>
                      <Label>
                        Related Time Entry {isRelatedTimeEntryRequired() ? '*' : '(Optional)'}
                      </Label>
                      <button
                        type="button"
                        onClick={() => setShowTimeEntryModal(true)}
                        className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <span className="text-sm">
                          {selectedTimeEntryDisplay
                            ? `${selectedTimeEntryDisplay.date} ${selectedTimeEntryDisplay.time}`
                            : 'Select time entry from calendar'}
                        </span>
                        <CalendarIcon className="w-4 h-4 text-gray-500" />
                      </button>
                      {errors.timeEntryId && (
                        <p className="mt-1 text-xs text-error-500">{errors.timeEntryId}</p>
                      )}
                    </div>
                  )}

                  {/* Time Start and Time End */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Time Start */}
                    <div>
                      <Label htmlFor="timeStart">Time Start *</Label>
                      <Input
                        id="timeStart"
                        type="time"
                        value={formData.timeStart}
                        onChange={(e) => handleInputChange('timeStart', e.target.value)}
                        error={!!errors.timeStart}
                        hint={errors.timeStart || 'e.g., 09:00'}
                        required
                      />
                    </div>

                    {/* Time End */}
                    <div>
                      <Label htmlFor="timeEnd">Time End *</Label>
                      <Input
                        id="timeEnd"
                        type="time"
                        value={formData.timeEnd}
                        onChange={(e) => handleInputChange('timeEnd', e.target.value)}
                        error={!!errors.timeEnd}
                        hint={errors.timeEnd || 'e.g., 17:00'}
                        required
                      />
                    </div>
                  </div>

                  {/* Reason / Justification */}
                  <div>
                    <Label htmlFor="reason">Reason / Justification *</Label>
                    <TextArea
                      placeholder="Explain why overtime is needed (e.g., project deadline, urgent task, client requirement)"
                      rows={4}
                      value={formData.reason}
                      onChange={(value) => handleInputChange('reason', value)}
                      error={!!errors.reason}
                      hint={errors.reason || 'Required for audit and approval'}
                    />
                  </div>
                </div>
              </div>

              {/* Optional Fields Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Optional Information
                </h3>
                <div className="space-y-4">
                  {/* Remarks */}
                  <div>
                    <Label htmlFor="remarks">Remarks</Label>
                    <TextArea
                      placeholder="Additional context or notes (optional)"
                      rows={3}
                      value={formData.remarks}
                      onChange={(value) => handleInputChange('remarks', value)}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setFormData({
                      workDate: '',
                      timeEntryId: '',
                      timeStart: '',
                      timeEnd: '',
                      reason: '',
                      otType: '',
                      remarks: '',
                    });
                    setErrors({});
                    setSubmitStatus('idle');
                  }}
                >
                  Clear Form
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                >
                  Submit Request
                </Button>
              </div>
            </form>

            {/* Info Card */}
            <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-800 dark:bg-brand-900/20 lg:p-6">
              <h3 className="font-semibold text-brand-900 dark:text-brand-100 mb-3">
                Important Information
              </h3>
              <ul className="text-sm text-brand-800 dark:text-brand-200 space-y-2">
                <li>✓ You request approval, not pay - the final rate and payable hours are determined by HR</li>
                <li>✓ Your requested OT can be less than actual hours worked</li>
                <li>✓ All requests are subject to company policy and manager approval</li>
                <li>✓ Approved OT will be reflected in your next payroll</li>
                <li>✓ Keep records of work-related communications for reference</li>
              </ul>
            </div>
          </div>

          {/* Time Entry Calendar Modal */}
          <TimeEntrySelectionModal
            isOpen={showTimeEntryModal}
            onClose={() => setShowTimeEntryModal(false)}
            onSelectTimeEntry={(timeEntry) => {
              setFormData(prev => ({
                ...prev,
                timeEntryId: timeEntry.id,
              }));
              setSelectedTimeEntryDisplay({
                date: timeEntry.date,
                time: `${timeEntry.startTime} - ${timeEntry.endTime}`
              });
              if (errors.timeEntryId) {
                setErrors(prev => ({
                  ...prev,
                  timeEntryId: ''
                }));
              }
              setShowTimeEntryModal(false);
            }}
            selectedTimeEntryId={formData.timeEntryId}
          />

          {/* Validation Modal */}
          <DetailsConfirmationModal
            isOpen={showValidationModal}
            onClose={() => setShowValidationModal(false)}
            onConfirm={handleConfirmSubmit}
            title="Confirm Overtime Request"
            description="Please review your overtime request details before submitting."
            details={[
              { label: 'Work Date', value: formData.workDate },
              { label: 'OT Type', value: otTypeOptions.find(opt => opt.value === formData.otType)?.label || formData.otType },
              { label: 'Time Start', value: formData.timeStart },
              { label: 'Time End', value: formData.timeEnd },
              { label: 'Related Time Entry', value: selectedTimeEntryDisplay ? `${selectedTimeEntryDisplay.date} ${selectedTimeEntryDisplay.time}` : 'None' },
              { label: 'Reason', value: formData.reason },
              { label: 'Remarks', value: formData.remarks || 'None' },
            ]}
            confirmText="Submit Request"
            cancelText="Cancel"
          />
        </div>
      </div>
    </>
  );
}
