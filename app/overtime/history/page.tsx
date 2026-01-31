'use client';

import { useState, useEffect } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import PageMeta from '@/components/common/PageMeta';
import ComponentCard from '@/components/common/ComponentCard';
import { BadgeColor } from '@/components/ui/badge/Badge';
import Badge from '@/components/ui/badge/Badge';

interface OvertimeRecord {
  id: string;
  workDate: string;
  requestedMinutes: number;
  approvedMinutes: number | null;
  status: string;
  reason: string;
  remarks: string | null;
  approvedByUser?: {
    email: string;
  } | null;
  approvedAt: string | null;
}

export default function OTHistoryPage() {
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOvertimeHistory();
  }, []);

  const fetchOvertimeHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/overtime-requests', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch overtime history');
      }

      const data = await response.json();
      setOvertimeRecords(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string): BadgeColor => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getDisplayStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Approval';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const formatApprovedBy = (approvedByUser: OvertimeRecord['approvedByUser']) => {
    if (!approvedByUser) return 'N/A';
    return approvedByUser.email;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <PageBreadcrumb
            pageTitle="Overtime History"
            breadcrumbs={[
              { label: 'Overtime', href: '/overtime' },
              { label: 'History' }
            ]}
          />
          <ComponentCard title="">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <PageBreadcrumb
            pageTitle="Overtime History"
            breadcrumbs={[
              { label: 'Overtime', href: '/overtime' },
              { label: 'History' }
            ]}
          />
          <ComponentCard title="">
            <div className="text-center py-8">
              <p className="text-error-500 mb-4">Error loading overtime history</p>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
              <button
                onClick={fetchOvertimeHistory}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </ComponentCard>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Overtime History - HR Management System"
        description="View your overtime request history"
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Page Header with Breadcrumb */}
          <PageBreadcrumb
            pageTitle="Overtime History"
            breadcrumbs={[
              { label: 'Overtime', href: '/overtime' },
              { label: 'History' }
            ]}
          />

          {/* Content Card */}
          <ComponentCard title="">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Overtime Requests
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                View all your overtime requests and their current status
              </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Work Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Requested (min)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Approved (min)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Approved By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Approved At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {overtimeRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No overtime requests found
                      </td>
                    </tr>
                  ) : (
                    overtimeRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(record.workDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {record.requestedMinutes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {record.approvedMinutes || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge color={getStatusBadgeColor(record.status)}>
                            {getDisplayStatus(record.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {record.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatApprovedBy(record.approvedByUser)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {record.approvedAt ? formatDate(record.approvedAt) : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {overtimeRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No overtime requests found
                </div>
              ) : (
                overtimeRecords.map((record) => (
                  <div key={record.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(record.workDate)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Requested: {record.requestedMinutes} min
                          {record.approvedMinutes && ` | Approved: ${record.approvedMinutes} min`}
                        </div>
                      </div>
                      <Badge color={getStatusBadgeColor(record.status)}>
                        {getDisplayStatus(record.status)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Reason:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{record.reason}</span>
                      </div>
                      
                      {record.remarks && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Remarks:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{record.remarks}</span>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Approved By:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{formatApprovedBy(record.approvedByUser)}</span>
                      </div>
                      
                      {record.approvedAt && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Approved At:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{formatDate(record.approvedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}
