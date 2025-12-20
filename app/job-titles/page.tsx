'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { PlusIcon, BriefcaseIcon } from '@/app/icons';
import ComponentCard from '@/app/components/common/ComponentCard';
import PageMeta from '@/app/components/common/PageMeta';
import PageBreadcrumb from '@/app/components/common/PageBreadCrumb';
import Pagination from '@/app/components/ui/pagination';
import ConfirmationModal from '@/app/components/ui/modal/ConfirmationModal';
import ErrorModal from '@/app/components/ui/modal/ErrorModal';
import JobTitleTable from '@/app/components/job-titles/JobTitleTable';
import JobTitleCardList from '@/app/components/job-titles/JobTitleCardList';
import RoleComponentWrapper from '@/app/components/common/RoleComponentWrapper';
import { useAuth } from '@/app/components/providers/auth-provider';

interface Organization {
  id: number;
  name: string;
}

interface JobTitle {
  id: number;
  name: string;
  description?: string;
  organization: {
    id: number;
    name: string;
  };
  employees: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
}

interface ApiResponse {
  data: JobTitle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function JobTitlesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ApiResponse['pagination'] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [jobTitleToDelete, setJobTitleToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') || user?.role === 'SUPER_ADMIN';

  // Memoize expensive calculations to prevent unnecessary re-renders
  const isSuperAdminMemo = useMemo(() => 
    user?.roles?.includes('SUPER_ADMIN') || user?.role === 'SUPER_ADMIN', 
    [user?.roles, user?.role]
  );

  const organizationOptions = useMemo(() => 
    organizations.map((org) => ({
      value: org.id.toString(),
      label: org.name,
    })), 
    [organizations]
  );

  // Memoize event handlers to prevent unnecessary re-renders
  const handleOrganizationChange = useCallback((orgId: number | null) => {
    setSelectedOrganization(orgId);
    setCurrentPage(1); // Reset to first page when changing organization filter
  }, []);

  const handleDeleteClick = useCallback((jobTitleId: number, jobTitleName: string) => {
    setJobTitleToDelete({ id: jobTitleId, name: jobTitleName });
    setDeleteSuccess(false);
    setShowDeleteModal(true);
  }, []);

  // Memoize the empty state component to prevent unnecessary re-renders
  const emptyStateComponent = useMemo(() => (
    jobTitles.length === 0 && (
      <div className="text-center py-12">
        <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No job titles found</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Get started by adding your first job title.
        </p>
        <Link
          href="/job-titles/add"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Job Title
        </Link>
      </div>
    )
  ), [jobTitles.length]);

  const fetchJobTitles = async (orgId?: number | null, page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');

      if (orgId) {
        params.set('organization_id', orgId.toString());
      }

      const url = `/api/job-titles?${params.toString()}`;
      const response = await fetch(url, {
        credentials: 'include',
      });

      if (response.status === 401) {
        setError('Unauthorized access. Please log in.');
        return;
      }

      if (response.status === 403) {
        setError('Access denied. Insufficient permissions.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch job titles');
      }

      const result = await response.json();
      setJobTitles(result.data || []);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error fetching job titles:', error);
      setError('Failed to load job titles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations?limit=100', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setOrganizations(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    // For non-super admin, always filter by their organization
    if (!isSuperAdminMemo && user?.organization_id) {
      fetchJobTitles(user.organization_id, currentPage);
    } else {
      fetchJobTitles(selectedOrganization, currentPage);
    }

    // Only fetch organizations for super admin
    if (isSuperAdminMemo) {
      fetchOrganizations();
    }
  }, [selectedOrganization, currentPage, authLoading, isSuperAdminMemo, user?.organization_id]);

  const handleConfirmDelete = async () => {
    if (!jobTitleToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/job-titles/${jobTitleToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setDeleteSuccess(true);
        // Refresh the list after a short delay to show success state
        setTimeout(() => {
          setShowDeleteModal(false);
          setJobTitleToDelete(null);
          setDeleteSuccess(false);
          if (!isSuperAdmin && user?.organization_id) {
            fetchJobTitles(user.organization_id, currentPage);
          } else {
            fetchJobTitles(selectedOrganization, currentPage);
          }
        }, 1500);
      } else {
        const errorData = await response.json();
        setShowDeleteModal(false);
        setErrorMessage(errorData.error || 'Failed to delete job title');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error deleting job title:', error);
      setShowDeleteModal(false);
      setErrorMessage('An error occurred while deleting the job title');
      setShowErrorModal(true);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Job Titles
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage job titles in your organization
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading job titles...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Job Titles
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage job titles in your organization
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-lg mb-2">Error</div>
            <div className="text-gray-600 dark:text-gray-300">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageMeta title='Job Titles - HR Management System' description='Manage job titles' />
      <PageBreadcrumb
        pageTitle='Job Titles'
        breadcrumbs={[
          { label: 'Job Titles' }
        ]}
      />

      {/* Content Container */}
      <div className="w-full overflow-x-auto">
        <ComponentCard title="Job Title Management" size="full">
          {/* Organization Filter - Only for Super Admin */}
          <RoleComponentWrapper roles={['SUPER_ADMIN']}>
            <div className="mb-6">
              <label htmlFor="organization-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Organization
              </label>
              <select
                id="organization-select"
                value={selectedOrganization || ''}
                onChange={(e) => handleOrganizationChange(e.target.value ? Number(e.target.value) : null)}
                disabled={loading}
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Organizations</option>
                {organizationOptions.map((org) => (
                  <option key={org.value} value={org.value}>
                    {org.label}
                  </option>
                ))}
              </select>
            </div>
          </RoleComponentWrapper>

          {/* Add Job Title Button */}
          <div className="flex justify-end mb-6">
            <Link
              href="/job-titles/add"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Job Title
            </Link>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="relative">
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10 rounded-xl">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Loading job titles...</span>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Table View */}
          <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
            <JobTitleTable jobTitles={jobTitles} onDelete={handleDeleteClick} />
          </div>

          {/* Mobile Card View */}
          <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
            <JobTitleCardList jobTitles={jobTitles} onDelete={handleDeleteClick} />
          </div>

          {/* Empty State */}
          {!loading && emptyStateComponent}
        </ComponentCard>
      </div>

      {/* Pagination */}
      <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
        <Pagination
          pagination={pagination}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemName="job titles"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        size='wider'
        isOpen={showDeleteModal}
        onClose={() => {
          if (!deleteSuccess) {
            setShowDeleteModal(false);
            setJobTitleToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title={deleteSuccess ? "Deleted Successfully" : "Delete Job Title"}
        message={deleteSuccess
          ? `The job title "${jobTitleToDelete?.name}" has been deleted successfully.`
          : `Are you sure you want to delete the job title "${jobTitleToDelete?.name}"? This action cannot be undone.`
        }
        variant={deleteSuccess ? "success" : "warning"}
        confirmText={deleteSuccess ? "Done" : "Delete"}
        cancelText="Cancel"
        isLoading={isDeleting}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errorMessage={errorMessage}
      />
    </div>
  );
}
