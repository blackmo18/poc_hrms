'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CalendarIcon, PlusIcon, CopyIcon, EyeIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import OrganizationFilter from '@/components/common/OrganizationFilter';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import { DetailItem, GroupedItem } from '@/lib/models/modal';

interface HolidayTemplate {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  isDefault: boolean;
  holidays: Holiday[];
  createdAt: string;
  updatedAt: string;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'REGULAR' | 'SPECIAL_NON_WORKING';
  rateMultiplier: number;
  isPaidIfNotWorked: boolean;
  countsTowardOt: boolean;
}

function HolidayTemplatesContent() {
  const [templates, setTemplates] = useState<HolidayTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<HolidayTemplate | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [copyYear, setCopyYear] = useState(new Date().getFullYear());
  const [copyTemplateName, setCopyTemplateName] = useState('');
  const [templateDetails, setTemplateDetails] = useState<DetailItem[]>([]);
  const [holidayTableData, setHolidayTableData] = useState<{ headers: string[], rows: string[][] }>({ headers: [], rows: [] });

  const { selectedOrganization, organizationOptions, handleOrganizationChange, isOrganizationFilterLoading } = useOrganizationFilter({
    apiEndpoint: '/api/organizations',
    enabled: true,
    showAllOption: true,
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!selectedOrganization) {
        setTemplates([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/holiday-templates?organizationId=${selectedOrganization}`);
        const data = await response.json();

        if (data.success) {
          setTemplates(data.data);
        }
      } catch (error) {
        console.error('Error fetching holiday templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [selectedOrganization]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTemplateTypeColor = (isDefault: boolean) => {
    return isDefault ? 'success' : 'primary';
  };

  const getHolidayColor = (type: string) => {
    return type === 'REGULAR' ? 'primary' : 'warning';
  };

  const generateTemplateDetails = (template: HolidayTemplate) => {
    const details: DetailItem[] = [];
    
    // Template information first
    details.push({ label: 'Template Name', value: template.name });
    details.push({ label: 'Description', value: template.description || 'No description' });
    details.push({ label: 'Type', value: template.isDefault ? 'System Template' : 'Custom Template' });
    details.push({ label: 'Total Holidays', value: template.holidays.length.toString() });
    details.push({ label: 'Created', value: formatDate(template.createdAt) });
    details.push({ label: 'Last Updated', value: formatDate(template.updatedAt) });
    
    return details;
  };

  const generateHolidayTableData = (template: HolidayTemplate) => {
    const headers = ['Holiday Name', 'Date', 'Type', 'Rate Multiplier', 'Paid if Not Worked', 'Counts Toward OT'];
    const rows = template.holidays.map(holiday => [
      holiday.name,
      formatDate(holiday.date),
      holiday.type,
      holiday.rateMultiplier.toString(),
      holiday.isPaidIfNotWorked ? 'Yes' : 'No',
      holiday.countsTowardOt ? 'Yes' : 'No'
    ]);
    
    return { headers, rows };
  };

  const handleViewTemplate = (template: HolidayTemplate) => {
    setSelectedTemplate(template);
    setTemplateDetails(generateTemplateDetails(template));
    setHolidayTableData(generateHolidayTableData(template));
    setShowDetailsModal(true);
  };

  const handleCopyTemplateClick = () => {
    if (!copyTemplateName) {
      alert('Please enter a template name');
      return;
    }
    if (selectedTemplate) {
      handleCopyTemplate(selectedTemplate.id);
    }
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedTemplate(null);
    setTemplateDetails([]);
  };

  const handleCopyTemplate = async (templateId: string) => {
    if (!copyTemplateName || !selectedOrganization) return;

    try {
      const response = await fetch('/api/holidays/copy-from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceTemplateId: templateId,
          targetOrganizationId: selectedOrganization,
          newTemplateName: copyTemplateName,
          targetYear: copyYear,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh templates list
        const templatesResponse = await fetch(`/api/holiday-templates?organizationId=${selectedOrganization}`);
        const templatesData = await templatesResponse.json();
        if (templatesData.success) {
          setTemplates(templatesData.data);
        }

        // Reset modal
        setShowCopyModal(false);
        setCopyTemplateName('');
        setCopyYear(new Date().getFullYear());
      } else {
        console.error('Error copying template:', data.error);
      }
    } catch (error) {
      console.error('Error copying template:', error);
    }
  };

  if (isOrganizationFilterLoading) {
    return (
      <>
        <PageBreadcrumb pageTitle="Holiday Templates" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-8">Loading organizations...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageBreadcrumb pageTitle="Holiday Templates" />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header with Action */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Holiday Templates</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and copy holiday templates for your organization</p>
          </div>
          <Button
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => window.open('/holidays/templates/create', '_blank')}
          >
            <PlusIcon className="w-4 h-4" />
            Create Template
          </Button>
        </div>

        {/* Organization Filter */}
        <Card>
          <div className="mb-6">
            <OrganizationFilter
              selectedOrganization={selectedOrganization}
              organizationOptions={organizationOptions}
              onOrganizationChange={handleOrganizationChange}
            />
          </div>
        </Card>

        {selectedOrganization && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Templates</p>
                  <p className="text-2xl font-bold mt-2">{loading ? '...' : templates.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">System Templates</p>
                  <p className="text-2xl font-bold mt-2">{loading ? '...' : templates.filter(t => t.isDefault).length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Custom Templates</p>
                  <p className="text-2xl font-bold mt-2">{loading ? '...' : templates.filter(t => !t.isDefault).length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Templates Table */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Template List</h2>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading templates...</div>
                ) : (
                  <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                    <div className="w-full overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                          <TableRow>
                            <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Template Name
                            </TableCell>
                            <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Type
                            </TableCell>
                            <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Holidays Count
                            </TableCell>
                            <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Created
                            </TableCell>
                            <TableCell isHeader className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {templates.map((template) => (
                            <TableRow key={template.id}>
                              <TableCell className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {template.name}
                                  </div>
                                  {template.description && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {template.description}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4 whitespace-nowrap">
                                <Badge
                                  color={getTemplateTypeColor(template.isDefault)}
                                  variant="light"
                                >
                                  {template.isDefault ? 'System' : 'Custom'}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {template.holidays.length}
                              </TableCell>
                              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {formatDate(template.createdAt)}
                              </TableCell>
                              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewTemplate(template)}
                                  >
                                    <EyeIcon className="w-4 h-4" />
                                  </Button>
                                  {!template.isDefault && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedTemplate(template);
                                        setCopyTemplateName(`${template.name} - Copy`);
                                        setShowCopyModal(true);
                                      }}
                                    >
                                      <CopyIcon className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          {/* Template Details Modal */}
          <Modal
            isOpen={showDetailsModal}
            onClose={handleCloseDetailsModal}
            className="max-w-4xl m-4"
          >
            <div className="no-scrollbar relative w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
              <div className="px-2 pr-14">
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">
                    {selectedTemplate?.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedTemplate?.description || 'No description'}
                  </p>
                </div>
              </div>

              <div className="px-2 mb-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {/* Template Details Section */}
                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
                    Template Information
                  </h5>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <Table>
                      <TableBody>
                        {templateDetails.map((detail, index) => (
                          <TableRow key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                            <TableCell className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 w-1/3">
                              {detail.label}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {detail.value}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Holidays Table Section */}
                <div>
                  <h5 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
                    Holidays ({holidayTableData.rows.length})
                  </h5>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {holidayTableData.headers.map((header, index) => (
                            <TableCell key={index} className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700">
                              {header}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {holidayTableData.rows.map((row, rowIndex) => (
                          <TableRow key={rowIndex} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                            {row.map((cell, cellIndex) => (
                              <TableCell key={cellIndex} className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                {cell}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleCloseDetailsModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </Modal>

          {/* Copy Template Modal */}
          <ConfirmationModal
            isOpen={showCopyModal}
            onClose={() => {
              setShowCopyModal(false);
              setCopyTemplateName('');
              setCopyYear(new Date().getFullYear());
            }}
            onConfirm={handleCopyTemplateClick}
            title="Copy Template"
            message={`Create a copy of "${selectedTemplate?.name}" template`}
            details={[
              { label: 'Template Name', value: copyTemplateName || 'Not specified' },
              { label: 'Year', value: copyYear.toString() }
            ]}
            variant="info"
            size="default"
            confirmText="Copy Template"
            cancelText="Cancel"
            isLoading={loading}
          />
        </>
        )}

        {!selectedOrganization && (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            Please select an organization to view holiday templates.
          </div>
        )}
      </div>
    </>
  );
}

export default function HolidayTemplatesPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <HolidayTemplatesContent />
    </ProtectedRoute>
  );
}
