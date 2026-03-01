'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Button from '@/components/ui/button/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import OrganizationFilter from '@/components/common/OrganizationFilter';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { PlusIcon, TrashIcon, SaveIcon } from 'lucide-react';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/input/Checkbox';
import DatePicker from '@/components/form/date-picker';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import DetailsConfirmationModal from '@/components/ui/modal/DetailsConfirmationModal';
import ErrorModal from '@/components/ui/modal/ErrorModal';
import { DetailItem, GroupedItem } from '@/lib/models/modal';
import { createDateFromYYYYMMDD } from '@/lib/utils/date-utils';

interface Holiday {
  id: string;
  name: string;
  date: string | Date;
  type: 'REGULAR' | 'SPECIAL_NON_WORKING' | 'SPECIAL_WORKING' | 'COMPANY' | 'LGU';
  rateMultiplier: number;
  isPaidIfNotWorked: boolean;
  countsTowardOt: boolean;
}

interface TemplateData {
  name: string;
  description: string;
  organizationId: string;
  holidays: Holiday[];
}

function CreateTemplateContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<DetailItem[]>([]);
  const [templatePreview, setTemplatePreview] = useState<GroupedItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [templateData, setTemplateData] = useState<TemplateData>({
    name: '',
    description: '',
    organizationId: '',
    holidays: [],
  });

  const { selectedOrganization, organizationOptions, isOrganizationFilterLoading } = useOrganizationFilter({
    apiEndpoint: '/api/organizations',
    enabled: true,
    showAllOption: false,
  });

  const handleOrganizationChange = (orgId: string) => {
    setTemplateData(prev => ({ ...prev, organizationId: orgId }));
  };

  const addHoliday = () => {
    const newHoliday: Holiday = {
      id: Date.now().toString(),
      name: '',
      date: '',
      type: 'REGULAR',
      rateMultiplier: 1.0,
      isPaidIfNotWorked: true,
      countsTowardOt: false,
    };
    setTemplateData(prev => ({
      ...prev,
      holidays: [...prev.holidays, newHoliday],
    }));
  };

  const removeHoliday = (id: string) => {
    setTemplateData(prev => ({
      ...prev,
      holidays: prev.holidays.filter(h => h.id !== id),
    }));
  };

  const updateHoliday = (id: string, field: keyof Holiday, value: any) => {
    setTemplateData(prev => ({
      ...prev,
      holidays: prev.holidays.map(h =>
        h.id === id ? { ...h, [field]: value } : h
      ),
    }));
  };

  const validateTemplate = () => {
    const errors: DetailItem[] = [];

    // Validate template name
    if (!templateData.name.trim()) {
      errors.push({ label: 'Template Name', value: 'Required field is empty' });
    }

    // Validate organization
    if (!templateData.organizationId) {
      errors.push({ label: 'Organization', value: 'Please select an organization' });
    }

    // Validate holidays
    if (templateData.holidays.length === 0) {
      errors.push({ label: 'Holidays', value: 'At least one holiday is required' });
    } else {
      templateData.holidays.forEach((holiday, index) => {
        const holidayPrefix = `Holiday ${index + 1}`;
        
        if (!holiday.name.trim()) {
          errors.push({ label: `${holidayPrefix} - Name`, value: 'Required field is empty' });
        }
        
        if (!holiday.date) {
          errors.push({ label: `${holidayPrefix} - Date`, value: 'Required field is empty' });
        }
        
        if (!holiday.type) {
          errors.push({ label: `${holidayPrefix} - Type`, value: 'Please select a holiday type' });
        }
      });
    }

    return errors;
  };

  const generateTemplatePreview = () => {
  const preview: GroupedItem[] = [];
  
  // Template details
  const templateDetails: DetailItem[] = [
    { label: 'Template Name', value: templateData.name || 'Not specified' },
    { label: 'Description', value: templateData.description || 'No description' },
    { label: 'Organization', value: organizationOptions.find(org => org.value === templateData.organizationId)?.label || 'Not selected' },
    { label: 'Total Holidays', value: templateData.holidays.length.toString() }
  ];
  
  preview.push({
    name: 'Template Details',
    fields: templateDetails
  });
  
  // Holiday details
  templateData.holidays.forEach((holiday, index) => {
    const holidayDetails: DetailItem[] = [
      { label: 'Name', value: holiday.name || 'Not specified' },
      { label: 'Date', value: holiday.date instanceof Date ? holiday.date.toLocaleDateString() : (holiday.date || 'Not selected') },
      { label: 'Type', value: holiday.type || 'Not selected' },
      { label: 'Rate Multiplier', value: holiday.rateMultiplier?.toString() || '1.0' },
      { label: 'Paid if Not Worked', value: holiday.isPaidIfNotWorked ? 'Yes' : 'No' },
      { label: 'Counts Toward OT', value: holiday.countsTowardOt ? 'Yes' : 'No' }
    ];
    
    preview.push({
      name: `Holiday ${index + 1}`,
      fields: holidayDetails
    });
  });
  
  return preview;
  };

  const saveTemplate = async () => {
    const errors = validateTemplate();
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

    // Show confirmation modal with preview
    setTemplatePreview(generateTemplatePreview());
    setShowConfirmModal(true);
  };

  const confirmSaveTemplate = async () => {
    setShowConfirmModal(false);
    setSaving(true);
    try {
      // Format holidays with proper date handling to avoid timezone issues
      const formattedHolidays = templateData.holidays.map(holiday => {
        const dateStr = holiday.date instanceof Date 
          ? holiday.date.getFullYear() + '-' + 
            String(holiday.date.getMonth() + 1).padStart(2, '0') + '-' + 
            String(holiday.date.getDate()).padStart(2, '0')
          : holiday.date;
        
        return {
          ...holiday,
          date: dateStr // Send as YYYY-MM-DD string, not ISO string
        };
      });

      const response = await fetch('/api/holiday-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateData.name,
          description: templateData.description,
          organizationId: templateData.organizationId,
          holidays: formattedHolidays,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccessModal(true);
      } else {
        setErrorMessage(data.error || 'Failed to create template');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      setErrorMessage('Failed to connect to server');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/holidays/templates');
  };

  if (isOrganizationFilterLoading) {
    return (
      <>
        <PageBreadcrumb pageTitle="Create Holiday Template" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-8">Loading organizations...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageBreadcrumb pageTitle="Create Holiday Template" />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Create Holiday Template</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Create a new holiday template for your organization</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant='outline'
              size='md'
              onClick={() => router.push('/holidays/templates')}
            >
              Cancel
            </Button>
            <Button
              onClick={saveTemplate}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SaveIcon className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>

        {/* Organization Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organization *
              </label>
              <OrganizationFilter
                selectedOrganization={templateData.organizationId}
                organizationOptions={organizationOptions}
                onOrganizationChange={handleOrganizationChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Template Details */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Template Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Template Name *
              </label>
              <Input
                type="text"
                value={templateData.name}
                onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <TextArea
                value={templateData.description}
                onChange={(value) => setTemplateData(prev => ({ ...prev, description: value }))}
                placeholder="Enter template description (optional)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Holidays */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Holidays ({templateData.holidays.length})</h2>
              <Button
                onClick={addHoliday}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Holiday
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {templateData.holidays.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No holidays added yet. Click "Add Holiday" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {templateData.holidays.map((holiday, index) => (
                  <div key={holiday.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-md font-medium text-gray-900 dark:text-white">
                        Holiday {index + 1}
                      </h3>
                      <Button
                        onClick={() => removeHoliday(holiday.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Holiday Name *
                        </label>
                        <Input
                          type="text"
                          value={holiday.name}
                          onChange={(e) => updateHoliday(holiday.id, 'name', e.target.value)}
                          placeholder="e.g., New Year's Day"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Date *
                        </label>
                        <DatePicker
                          id={`holiday-date-${holiday.id}`}
                          onChange={(selectedDates) => {
                            if (selectedDates && selectedDates.length > 0) {
                              const date = selectedDates[0];
                              if (date instanceof Date) {
                                // Use date utility to avoid timezone issues
                                updateHoliday(holiday.id, 'date', date);
                              }
                            }
                          }}
                          placeholder="Select holiday date"
                          defaultDate={holiday.date}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Type
                        </label>
                        <Select
                          value={holiday.type}
                          onChange={(value) => updateHoliday(holiday.id, 'type', value as 'REGULAR' | 'SPECIAL_NON_WORKING' | 'SPECIAL_WORKING' | 'COMPANY' | 'LGU')}
                          options={[
                            { value: 'REGULAR', label: 'Regular Holiday' },
                            { value: 'SPECIAL_NON_WORKING', label: 'Special Non-Working Holiday' },
                            { value: 'SPECIAL_WORKING', label: 'Special Working Holiday' },
                            { value: 'COMPANY', label: 'Company Holiday' },
                            { value: 'LGU', label: 'LGU Holiday' }
                          ]}
                          placeholder="Select holiday type"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Rate Multiplier
                        </label>
                        <Input
                          type="number"
                          step={0.1}
                          min="0.5"
                          max="3.0"
                          value={holiday.rateMultiplier}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              updateHoliday(holiday.id, 'rateMultiplier', value);
                            }
                          }}
                        />
                      </div>

                      <div className="flex items-center">
                        <Checkbox
                          id={`paid-${holiday.id}`}
                          checked={holiday.isPaidIfNotWorked}
                          onChange={(checked) => updateHoliday(holiday.id, 'isPaidIfNotWorked', checked)}
                          label="Paid if not worked"
                        />
                      </div>

                      <div className="flex items-center">
                        <Checkbox
                          id={`ot-${holiday.id}`}
                          checked={holiday.countsTowardOt}
                          onChange={(checked) => updateHoliday(holiday.id, 'countsTowardOt', checked)}
                          label="Counts toward OT"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Validation Modal */}
      <ConfirmationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        onConfirm={() => setShowValidationModal(false)}
        title="Validation Errors"
        message="Please fix the following errors before saving the template:"
        details={validationErrors}
        variant="error"
        size="wide"
        confirmText="Fix Errors"
        cancelText="Close"
      />

      {/* Confirmation Modal */}
      <DetailsConfirmationModal
        displayStyle="separated"
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSaveTemplate}
        title="Confirm Template Creation"
        description="Please review the template details before saving:"
        groupedDetails={templatePreview}
        size="extra-wide"
        confirmText="Create Template"
        cancelText="Cancel"
        isLoading={saving}
      />

      {/* Success Modal */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        onConfirm={handleSuccessModalClose}
        title="Success!"
        message="Holiday template has been created successfully."
        variant="success"
        size="small"
        confirmText="Continue"
        cancelText=""
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        errorMessage={errorMessage}
      />
    </>
  );
}

export default function CreateTemplatePage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <CreateTemplateContent />
    </ProtectedRoute>
  );
}