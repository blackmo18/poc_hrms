'use client';

import { useState, useEffect } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge/Badge';
import { CheckIcon, XIcon } from 'lucide-react';
import OrganizationFilter from '@/components/common/OrganizationFilter';
import PeriodSelection from '@/components/common/PeriodSelection';
import DetailsConfirmationModal from '@/components/ui/modal/DetailsConfirmationModal';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { usePayrollPeriods } from '@/hooks/usePayrollPeriods';
import ComponentCard from '@/components/common/ComponentCard';

function OvertimeApprovalsContent() {
  const [otRequests, setOtRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCutoff, setSelectedCutoff] = useState('All');
  const [modalState, setModalState] = useState({ isOpen: false, request: null, action: '', isLoading: false });

  const organizationFilter = useOrganizationFilter({
    apiEndpoint: '/api/organizations',
    enabled: true,
    showAllOption: true
  });

  const payrollPeriodsHook = usePayrollPeriods({
    lookbackPeriods: 1,
    lookaheadPeriods: 1,
    includeCurrentPeriod: true
  });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch(`/api/overtime/approval?organization=${organizationFilter.selectedOrganization || 'All'}&cutoff=${selectedCutoff}`);
        if (!response.ok) {
          throw new Error('Failed to fetch overtime requests');
        }
        const data = await response.json();
        setOtRequests(data);
      } catch (error) {
        console.error('Error fetching overtime requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [organizationFilter.selectedOrganization, selectedCutoff]);

  const periods = [
    { value: 'All', label: 'All Periods', startDate: new Date(), endDate: new Date() },
    ...payrollPeriodsHook.periods
  ];

  const orgMap = organizationFilter.organizationOptions.reduce((acc, opt) => ({
    ...acc,
    [opt.value]: opt.label
  }), {});

  const handleApprove = (id: number) => {
    const request = otRequests.find(r => r.id === id);
    if (request) {
      setModalState({ isOpen: true, request, action: 'approve', isLoading: false });
    }
  };

  const handleReject = (id: number) => {
    const request = otRequests.find(r => r.id === id);
    if (request) {
      setModalState({ isOpen: true, request, action: 'reject', isLoading: false });
    }
  };

  const handleConfirm = async () => {
    if (!modalState.request) return;

    setModalState(prev => ({ ...prev, isLoading: true }));

    try {
      if (modalState.action === 'approve') {
        const approvedMinutes = modalState.request.requestedHours * 60;
        const response = await fetch(`/api/overtime/requests/${modalState.request.id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approvedMinutes })
        });
        if (!response.ok) throw new Error('Failed to approve');
      } else {
        const response = await fetch(`/api/overtime/requests/${modalState.request.id}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to reject');
      }

      // Refetch data
      const fetchRequests = async () => {
        const res = await fetch(`/api/overtime/approval?organization=${organizationFilter.selectedOrganization || 'All'}&cutoff=${selectedCutoff}`);
        const data = await res.json();
        setOtRequests(data);
      };
      fetchRequests();

      setModalState({ isOpen: false, request: null, action: '', isLoading: false });
    } catch (error) {
      console.error('Error processing request:', error);
      setModalState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const filteredRequests = otRequests;

  const pendingCount = filteredRequests.filter(r => r.status === 'pending').length;
  const totalHours = filteredRequests.reduce((sum, r) => sum + (r.requestedHours || 0), 0);
  const approvedCount = filteredRequests.filter(r => r.status === 'approved').length;

  if (loading) {
    return (
      <>
        <PageBreadcrumb pageTitle="Overtime Approvals" />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          Loading overtime requests...
        </div>
      </>
    );
  }

  return (
    <>
      <PageBreadcrumb pageTitle="Overtime Approvals" />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="dark:bg-white/[0.03] dark:border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
              <p className="text-2xl font-bold mt-2">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-white/[0.03] dark:border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total OT Hours</p>
              <p className="text-2xl font-bold mt-2">{totalHours} hrs</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-white/[0.03] dark:border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved This Month</p>
              <p className="text-2xl font-bold mt-2">{approvedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <ComponentCard title="Filter">
          <OrganizationFilter
            selectedOrganization={organizationFilter.selectedOrganization}
            organizationOptions={organizationFilter.organizationOptions}
            onOrganizationChange={organizationFilter.handleOrganizationChange}
            className="mb-6"
          />

          <PeriodSelection
            selectedCutoff={selectedCutoff}
            onCutoffChange={setSelectedCutoff}
            payrollPeriods={periods}
            className="mb-6"
          />
        </ComponentCard>
        {/* OT Requests Table */}
        <ComponentCard title="Overtime Requests">
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">{request.employee}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{orgMap[request.organization] || request.organization}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{request.department}</p>
                  </div>
                  <Badge
                    color={request.status === 'pending' ? 'warning' : 'success'}
                    variant="light"
                  >
                    {request.status === 'pending' ? 'Pending' : 'Approved'}
                  </Badge>
                </div>
                {request.status === 'approved' && request.approvedBy && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Approved by: {request.approvedBy}
                  </p>
                )}
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">{request.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Hours Requested</p>
                    <p className="font-medium text-gray-900 dark:text-white">{request.requestedHours} hrs</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Reason</p>
                    <p className="font-medium text-gray-900 dark:text-white">{request.reason}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Submitted</p>
                    <p className="font-medium text-gray-900 dark:text-white">{request.submittedDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Approved By</p>
                    <p className="font-medium text-gray-900 dark:text-white">{request.approvedBy || ''}</p>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request.id)}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleReject(request.id)}
                      className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 border-red-200 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-300 dark:border-red-800"
                    >
                      <XIcon className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ComponentCard>
      </div>

      <DetailsConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, request: null, action: '', isLoading: false })}
        onConfirm={handleConfirm}
        title={modalState.action === 'approve' ? 'Approve Overtime Request' : 'Reject Overtime Request'}
        description="Please review the details and confirm your action."
        details={modalState.request ? [
          { label: 'Employee', value: modalState.request.employee },
          { label: 'Department', value: modalState.request.department },
          { label: 'Organization', value: orgMap[modalState.request.organization] || modalState.request.organization },
          { label: 'Date', value: modalState.request.date },
          { label: 'Hours Requested', value: `${modalState.request.requestedHours} hrs` },
          { label: 'Reason', value: modalState.request.reason },
          { label: 'Submitted', value: modalState.request.submittedDate },
        ] : []}
        confirmText={modalState.action === 'approve' ? 'Approve' : 'Reject'}
        cancelText="Cancel"
        isLoading={modalState.isLoading}
      />
    </>
  );
}

export default function OvertimeApprovalsPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <OvertimeApprovalsContent />
    </ProtectedRoute>
  );
}
