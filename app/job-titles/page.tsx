'use client';

import { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
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
import { useRoleAccess } from '@/app/components/providers/role-access-provider';

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

interface JobTitlesState {
  // Data states
  jobTitles: JobTitle[];
  organizations: Organization[];
  pagination: ApiResponse['pagination'] | null;

  // Loading states
  loading: boolean;
  initialLoading: boolean;
  isOrganizationFilterLoading: boolean;
  isDeleting: boolean;

  // UI states
  selectedOrganization: number | null;
  currentPage: number;
  showDeleteModal: boolean;
  showErrorModal: boolean;
  deleteSuccess: boolean;

  // Error states
  error: string | null;
  errorMessage: string;
  jobTitleToDelete: { id: number; name: string } | null;
}

type JobTitlesAction =
  // Data actions
  | { type: 'SET_JOB_TITLES'; payload: JobTitle[] }
  | { type: 'SET_ORGANIZATIONS'; payload: Organization[] }
  | { type: 'SET_PAGINATION'; payload: ApiResponse['pagination'] | null }

  // Loading actions
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIAL_LOADING'; payload: boolean }
  | { type: 'SET_ORGANIZATION_FILTER_LOADING'; payload: boolean }
  | { type: 'SET_DELETING'; payload: boolean }

  // UI actions
  | { type: 'SET_SELECTED_ORGANIZATION'; payload: number | null }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_SHOW_DELETE_MODAL'; payload: boolean }
  | { type: 'SET_SHOW_ERROR_MODAL'; payload: boolean }
  | { type: 'SET_DELETE_SUCCESS'; payload: boolean }

  // Error actions
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ERROR_MESSAGE'; payload: string }
  | { type: 'SET_JOB_TITLE_TO_DELETE'; payload: { id: number; name: string } | null }

  // Combined actions
  | { type: 'START_LOADING' }
  | { type: 'FINISH_LOADING' }
  | { type: 'START_ORGANIZATION_FILTER'; payload: number | null }
  | { type: 'START_DELETE'; payload: { id: number; name: string } }
  | { type: 'CANCEL_DELETE' }
  | { type: 'FINISH_DELETE' };

function jobTitlesReducer(state: JobTitlesState, action: JobTitlesAction): JobTitlesState {
  switch (action.type) {
    // Data actions
    case 'SET_JOB_TITLES':
      return { ...state, jobTitles: action.payload };
    case 'SET_ORGANIZATIONS':
      return { ...state, organizations: action.payload };
    case 'SET_PAGINATION':
      return { ...state, pagination: action.payload };

    // Loading actions
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_INITIAL_LOADING':
      return { ...state, initialLoading: action.payload };
    case 'SET_ORGANIZATION_FILTER_LOADING':
      return { ...state, isOrganizationFilterLoading: action.payload };
    case 'SET_DELETING':
      return { ...state, isDeleting: action.payload };

    // UI actions
    case 'SET_SELECTED_ORGANIZATION':
      return { ...state, selectedOrganization: action.payload };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_SHOW_DELETE_MODAL':
      return { ...state, showDeleteModal: action.payload };
    case 'SET_SHOW_ERROR_MODAL':
      return { ...state, showErrorModal: action.payload };
    case 'SET_DELETE_SUCCESS':
      return { ...state, deleteSuccess: action.payload };

    // Error actions
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ERROR_MESSAGE':
      return { ...state, errorMessage: action.payload };
    case 'SET_JOB_TITLE_TO_DELETE':
      return { ...state, jobTitleToDelete: action.payload };

    // Combined actions
    case 'START_LOADING':
      return { ...state, loading: true, error: null };
    case 'FINISH_LOADING':
      return { ...state, loading: false, initialLoading: false, isOrganizationFilterLoading: false };
    case 'START_ORGANIZATION_FILTER':
      return { ...state, selectedOrganization: action.payload, currentPage: 1, isOrganizationFilterLoading: true };
    case 'START_DELETE':
      return { ...state, jobTitleToDelete: action.payload, showDeleteModal: true, deleteSuccess: false };
    case 'CANCEL_DELETE':
      return { ...state, showDeleteModal: false, jobTitleToDelete: null };
    case 'FINISH_DELETE':
      return { ...state, isDeleting: false, showDeleteModal: false, jobTitleToDelete: null, deleteSuccess: false };

    default:
      return state;
  }
}

const initialState: JobTitlesState = {
  // Data states
  jobTitles: [],
  organizations: [],
  pagination: null,

  // Loading states
  loading: true,
  initialLoading: true,
  isOrganizationFilterLoading: false,
  isDeleting: false,

  // UI states
  selectedOrganization: null,
  currentPage: 1,
  showDeleteModal: false,
  showErrorModal: false,
  deleteSuccess: false,

  // Error states
  error: null,
  errorMessage: '',
  jobTitleToDelete: null,
};

export default function JobTitlesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { roles } = useRoleAccess();
  const [state, dispatch] = useReducer(jobTitlesReducer, initialState);

  const isSuperAdmin = roles.includes('SUPER_ADMIN');

  // Memoize expensive calculations to prevent unnecessary re-renders
  const isSuperAdminMemo = useMemo(() => 
    roles.includes('SUPER_ADMIN'), 
    [roles]
  );

  const organizationOptions = useMemo(() => 
    state.organizations.map((org) => ({
      value: org.id.toString(),
      label: org.name,
    })), 
    [state.organizations]
  );

  // Memoize event handlers to prevent unnecessary re-renders
  const handleOrganizationChange = useCallback((orgId: number | null) => {
    dispatch({ type: 'START_ORGANIZATION_FILTER', payload: orgId });
  }, []);

  const handleDeleteClick = useCallback((jobTitleId: number, jobTitleName: string) => {
    dispatch({ type: 'START_DELETE', payload: { id: jobTitleId, name: jobTitleName } });
  }, []);

  // Memoize the empty state component to prevent unnecessary re-renders
  const emptyStateComponent = useMemo(() => (
    state.jobTitles.length === 0 && (
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
  ), [state.jobTitles.length]);

  const fetchJobTitles = async (orgId?: number | null, page: number = 1) => {
    try {
      dispatch({ type: 'START_LOADING' });

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
        dispatch({ type: 'SET_ERROR', payload: 'Unauthorized access. Please log in.' });
        return;
      }

      if (response.status === 403) {
        dispatch({ type: 'SET_ERROR', payload: 'Access denied. Insufficient permissions.' });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch job titles');
      }

      const result = await response.json();
      dispatch({ type: 'SET_JOB_TITLES', payload: result.data || [] });
      dispatch({ type: 'SET_PAGINATION', payload: result.pagination });
    } catch (error) {
      console.error('Error fetching job titles:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load job titles. Please try again.' });
    } finally {
      dispatch({ type: 'FINISH_LOADING' });
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations?limit=100', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        dispatch({ type: 'SET_ORGANIZATIONS', payload: result.data || [] });
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    // For non-super admin, always filter by their organization
    if (!isSuperAdminMemo && user?.organization_id) {
      fetchJobTitles(Number(user.organization_id), state.currentPage);
    } else {
      fetchJobTitles(state.selectedOrganization, state.currentPage);
    }

    // Only fetch organizations for super admin
    if (isSuperAdminMemo) {
      fetchOrganizations();
    }
  }, [state.selectedOrganization, state.currentPage, authLoading, isSuperAdminMemo, user?.organization_id]);

  const handleConfirmDelete = async () => {
    if (!state.jobTitleToDelete) return;

    dispatch({ type: 'SET_DELETING', payload: true });
    try {
      const response = await fetch(`/api/job-titles/${state.jobTitleToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        dispatch({ type: 'SET_DELETE_SUCCESS', payload: true });
        // Refresh the list after a short delay to show success state
        setTimeout(() => {
          dispatch({ type: 'FINISH_DELETE' });
          if (!isSuperAdminMemo && user?.organization_id) {
            fetchJobTitles(Number(user.organization_id), state.currentPage);
          } else {
            fetchJobTitles(state.selectedOrganization, state.currentPage);
          }
        }, 1500);
      } else {
        const errorData = await response.json();
        dispatch({ type: 'FINISH_DELETE' });
        dispatch({ type: 'SET_ERROR_MESSAGE', payload: errorData.error || 'Failed to delete job title' });
        dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
      }
    } catch (error) {
      console.error('Error deleting job title:', error);
      dispatch({ type: 'FINISH_DELETE' });
      dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'An error occurred while deleting the job title' });
      dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
    }
  };

  if (state.initialLoading) { // display this only on first page load
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

  if (state.error) {
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
            <div className="text-gray-600 dark:text-gray-300">{state.error}</div>
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
          <RoleComponentWrapper roles={['SUPER_ADMIN']} showFallback={false}>
            <div className="mb-6">
              <label htmlFor="organization-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Organization
              </label>
              <select
                id="organization-select"
                value={state.selectedOrganization || ''}
                onChange={(e) => handleOrganizationChange(e.target.value ? Number(e.target.value) : null)}
                disabled={state.loading}
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

          {/* Desktop Table View */}
          <JobTitleTable jobTitles={state.jobTitles} onDelete={handleDeleteClick} loading={state.isOrganizationFilterLoading} currentPage={state.pagination?.page} limit={state.pagination?.limit} />

          {/* Mobile Card View */}
          <JobTitleCardList jobTitles={state.jobTitles} onDelete={handleDeleteClick} />

          {/* Empty State */}
          {!state.isOrganizationFilterLoading && emptyStateComponent}
        </ComponentCard>
      </div>

      {/* Pagination */}
      <div className={state.loading ? 'opacity-50 pointer-events-none' : ''}>
        <Pagination
          pagination={state.pagination}
          currentPage={state.currentPage}
          onPageChange={(page) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page })}
          itemName="job titles"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        size='wider'
        isOpen={state.showDeleteModal}
        onClose={() => {
          if (!state.deleteSuccess) {
            dispatch({ type: 'CANCEL_DELETE' });
          }
        }}
        onConfirm={handleConfirmDelete}
        title={state.deleteSuccess ? "Deleted Successfully" : "Delete Job Title"}
        message={state.deleteSuccess
          ? `The job title "${state.jobTitleToDelete?.name}" has been deleted successfully.`
          : `Are you sure you want to delete the job title "${state.jobTitleToDelete?.name}"? This action cannot be undone.`
        }
        variant={state.deleteSuccess ? "success" : "warning"}
        confirmText={state.deleteSuccess ? "Done" : "Delete"}
        cancelText="Cancel"
        isLoading={state.isDeleting}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={state.showErrorModal}
        onClose={() => dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: false })}
        errorMessage={state.errorMessage}
      />
    </div>
  );
}
