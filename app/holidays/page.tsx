'use client';

import { useState, useEffect } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatUTCDateToReadable } from '@/lib/utils/date-utils';
import Badge from '@/components/ui/badge/Badge';
import { CalendarIcon, PlusIcon, CopyIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import OrganizationFilter from '@/components/common/OrganizationFilter';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { CopyTemplateModal } from './components/CopyTemplateModal';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
  rateMultiplier: number;
  isPaidIfNotWorked: boolean;
  countsTowardOt: boolean;
  multiplier?: number;
  countsTowardOT?: boolean;
  holidayTemplate?: {
    id: string;
    name: string;
    isDefault: boolean;
    organization?: {
      name: string;
    };
  };
}

function HolidaysContent() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const { selectedOrganization, organizationOptions, handleOrganizationChange, isOrganizationFilterLoading } = useOrganizationFilter({
    apiEndpoint: '/api/organizations',
    enabled: true,
    showAllOption: true,
  });

  useEffect(() => {
    fetchHolidays();
  }, [selectedOrganization]);

  const formatDate = (dateStr: string) => {
    return formatUTCDateToReadable(dateStr);
  };

  const getHolidayColor = (type: string) => {
    return type === 'REGULAR' ? 'primary' : 'warning';
  };

  const handleCopySuccess = (result: any) => {
    // Refresh holidays after successful copy
    fetchHolidays();
    console.log('Template copied successfully:', result);
  };

  const fetchHolidays = async () => {
    if (!selectedOrganization) {
      setHolidays([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/holidays?organizationId=${selectedOrganization}&year=2026&includeTemplate=true`);
      const data = await response.json();

      if (data.success) {
        // Transform API data to match component expectations
        const transformedHolidays = data.data.map((holiday: Holiday) => ({
          ...holiday,
          multiplier: holiday.rateMultiplier,
          countsTowardOT: holiday.countsTowardOt,
        }));
        setHolidays(transformedHolidays);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group holidays by template
  const holidaysByTemplate = holidays.reduce((acc, holiday) => {
    const templateName = holiday.holidayTemplate?.name || 'No Template';
    if (!acc[templateName]) {
      acc[templateName] = {
        template: holiday.holidayTemplate,
        holidays: []
      };
    }
    acc[templateName].holidays.push(holiday);
    return acc;
  }, {} as Record<string, { template: Holiday['holidayTemplate']; holidays: Holiday[] }>);

  if (isOrganizationFilterLoading) {
    return (
      <>
        <PageBreadcrumb pageTitle="Holidays" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-8">Loading organizations...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageBreadcrumb pageTitle="Holidays" />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header with Action */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Holiday Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage PH national and company holidays</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setIsCopyModalOpen(true)}
              disabled={!selectedOrganization}
            >
              <CopyIcon className="w-4 h-4" />
              Copy Template
            </Button>
            <Button className="flex items-center gap-2 bg-blue-600">
              <PlusIcon className="w-4 h-4" />
              Add Holiday
            </Button>
          </div>
        </div>

        {/* Organization Filter */}
        <Card>
          <div className="mb-6">
            <OrganizationFilter
              selectedOrganization={selectedOrganization}
              organizationOptions={organizationOptions}
              onOrganizationChange={handleOrganizationChange}
              showAllOption={false}
            />
          </div>
        </Card>

        {selectedOrganization && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Holidays</p>
                  <p className="text-2xl font-bold mt-2">{loading ? '...' : holidays.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Regular Holidays</p>
                  <p className="text-2xl font-bold mt-2">{loading ? '...' : holidays.filter(h => h.type === 'REGULAR').length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Special Non-Working</p>
                  <p className="text-2xl font-bold mt-2">{loading ? '...' : holidays.filter(h => h.type === 'SPECIAL_NON_WORKING').length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Holidays Table */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Holiday List (Grouped by Template)</h2>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading holidays...</div>
                ) : Object.keys(holidaysByTemplate).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No holidays found. Copy a template to get started.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(holidaysByTemplate).map(([templateName, templateGroup]) => (
                      <div key={templateName} className="border rounded-lg overflow-hidden">
                        {/* Template Header */}
                        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {templateName}
                              </h3>
                              {templateGroup.template && (
                                <div className="flex items-center gap-2">
                                  {templateGroup.template.isDefault && (
                                    <Badge color="primary" variant="light" size="sm">
                                      System
                                    </Badge>
                                  )}
                                  {templateGroup.template.organization && (
                                    <Badge color="info" variant="light" size="sm">
                                      {templateGroup.template.organization.name}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {templateGroup.holidays.length} holidays
                            </div>
                          </div>
                        </div>

                        {/* Holidays for this template */}
                        <div className="hidden lg:block overflow-hidden">
                          <div className="w-full overflow-x-auto">
                            <Table>
                              <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                <TableRow>
                                  <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Holiday Name
                                  </TableCell>
                                  <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Date
                                  </TableCell>
                                  <TableCell isHeader className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Type
                                  </TableCell>
                                  <TableCell isHeader className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Multiplier
                                  </TableCell>
                                  <TableCell isHeader className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Paid if Not Worked
                                  </TableCell>
                                  <TableCell isHeader className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                  </TableCell>
                                </TableRow>
                              </TableHeader>
                              <TableBody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {templateGroup.holidays.map((holiday) => (
                                  <TableRow key={holiday.id}>
                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                      {holiday.name}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                      <div className="flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4 text-gray-500" />
                                        {formatDate(holiday.date)}
                                      </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                                      <Badge
                                        color={getHolidayColor(holiday.type)}
                                        variant="light"
                                      >
                                        {holiday.type === 'REGULAR' ? 'Regular' : 'Special'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900 dark:text-white">
                                      {holiday.multiplier}x
                                    </TableCell>
                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                                      {holiday.isPaidIfNotWorked ? '✓' : '✗'}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                      <Button variant="outline" size="sm">Edit</Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selectedOrganization && (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            Please select an organization to view holidays.
          </div>
        )}

        {/* Copy Template Modal */}
        {selectedOrganization && (
          <CopyTemplateModal
            isOpen={isCopyModalOpen}
            onClose={() => setIsCopyModalOpen(false)}
            organizationId={selectedOrganization}
            onSuccess={handleCopySuccess}
          />
        )}
      </div>
    </>
  );
}

export default function HolidaysPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <HolidaysContent />
    </ProtectedRoute>
  );
}
