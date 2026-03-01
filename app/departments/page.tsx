'use client';

import { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import Link from 'next/link';
import { PlusIcon, Building2Icon } from '@/icons';
import ComponentCard from '@/components/common/ComponentCard';
import PageMeta from '@/components/common/PageMeta';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Pagination from '@/components/ui/pagination';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import ErrorModal from '@/components/ui/modal/ErrorModal';
import DepartmentTable from '@/components/departments/DepartmentTable';
import DepartmentCardList from '@/components/departments/DepartmentCardList';
import RoleComponentWrapper from '@/components/common/RoleComponentWrapper';
import { useAuth } from '@/components/providers/auth-provider';
import { useRoleAccess } from '@/components/providers/role-access-provider';
import OrganizationFilter from '@/components/common/OrganizationFilter';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { BadgeColor } from "@/components/ui/badge/Badge";
import InitialLoadingScreen from '@/components/common/InitialLoadingScreen';

interface Organization {
  id: string;
  name: string;
}

interface Department {
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
  data: Department[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface DepartmentsState {
  // Data states
  departments: Department[];
  pagination: ApiResponse['pagination'] | null;

  // Loading states
  loading: boolean;
  initialLoading: boolean;

  // UI states
  showDeleteModal: boolean;
  showErrorModal: boolean;
  departmentToDelete: { id: number; name: string } | null;
  isDeleting: boolean;
  deleteSuccess: boolean;
  errorMessage: string;

  // Error states
  error: string | null;
}

type DepartmentsAction =
  // Data actions
  | { type: 'SET_DEPARTMENTS'; payload: Department[] }
  | { type: 'SET_PAGINATION'; payload: ApiResponse['pagination'] | null }

  // Loading actions
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIAL_LOADING'; payload: boolean }

  // UI actions
  | { type: 'SET_SHOW_DELETE_MODAL'; payload: boolean }
  | { type: 'SET_SHOW_ERROR_MODAL'; payload: boolean }
  | { type: 'SET_DEPARTMENT_TO_DELETE'; payload: { id: number; name: string } | null }
  | { type: 'SET_IS_DELETING'; payload: boolean }
  | { type: 'SET_DELETE_SUCCESS'; payload: boolean }
  | { type: 'SET_ERROR_MESSAGE'; payload: string }

  // Error actions
  | { type: 'SET_ERROR'; payload: string | null }

  // Combined actions
  | { type: 'START_LOADING' }
  | { type: 'FINISH_LOADING' };

function departmentsReducer(state: DepartmentsState, action: DepartmentsAction): DepartmentsState {
  switch (action.type) {
    // Data actions
    case 'SET_DEPARTMENTS':
      return { ...state, departments: action.payload };
    case 'SET_PAGINATION':
      return { ...state, pagination: action.payload };

    // Loading actions
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_INITIAL_LOADING':
      return { ...state, initialLoading: action.payload };

    // UI actions
    case 'SET_SHOW_DELETE_MODAL':
      return { ...state, showDeleteModal: action.payload };
    case 'SET_SHOW_ERROR_MODAL':
      return { ...state, showErrorModal: action.payload };
    case 'SET_DEPARTMENT_TO_DELETE':
      return { ...state, departmentToDelete: action.payload };
    case 'SET_IS_DELETING':
      return { ...state, isDeleting: action.payload };
    case 'SET_DELETE_SUCCESS':
      return { ...state, deleteSuccess: action.payload };
    case 'SET_ERROR_MESSAGE':
      return { ...state, errorMessage: action.payload };

    // Error actions
    case 'SET_ERROR':
      return { ...state, error: action.payload };

    // Combined actions
    case 'START_LOADING':
      return { ...state, loading: true, error: null };
    case 'FINISH_LOADING':
      return { ...state, loading: false, initialLoading: false };

    default:
      return state;
  }
}

const initialDepartmentsState: DepartmentsState = {
  // Data states
  departments: [],
  pagination: null,

  // Loading states
  loading: true,
  initialLoading: true,

  // UI states
  showDeleteModal: false,
  showErrorModal: false,
  departmentToDelete: null,
  isDeleting: false,
  deleteSuccess: false,
  errorMessage: '',

  // Error states
  error: null,
};

export default function DepartmentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { roles } = useRoleAccess();
  const [state, dispatch] = useReducer(departmentsReducer, initialDepartmentsState);

  // Use the reusable organization filter hook
  const {
    selectedOrganization,
    isOrganizationFilterLoading,
    currentPage: orgFilterCurrentPage,
    handleOrganizationChange,
    setCurrentPage: setOrgFilterCurrentPage,
    organizationOptions,
  } = useOrganizationFilter({
    apiEndpoint: '/api/departments',
    defaultPageSize: 15,
    onDataFetch: async (orgId, page, isOrgChange = false) => {
      await fetchDepartments(orgId, page, isOrgChange);
    },
  });

  const isSuperAdminMemo = useMemo(() =>
    roles.includes('SUPER_ADMIN'),
    [roles]
  );

  const fetchDepartments = async (orgId?: string, page: number = 1, isOrganizationChange: boolean = false) => {
    try {
      if (isOrganizationChange) {
        dispatch({ type: 'SET_LOADING', payload: true });
      } else {
        dispatch({ type: 'SET_INITIAL_LOADING', payload: true });
      }
      dispatch({ type: 'SET_ERROR', payload: null });

      const params = new URLSearchParams();
      if (orgId) params.set('organizationId', orgId.toString());
      params.set('page', page.toString());
      params.set('limit', '15');

      const url = `/api/departments?${params.toString()}`;
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
        throw new Error('Failed to fetch departments');
      }

      const result = await response.json();
      dispatch({ type: 'SET_DEPARTMENTS', payload: result.data || [] });
      dispatch({ type: 'SET_PAGINATION', payload: result.pagination });
    } catch (error) {
      console.error('Error fetching departments:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load departments. Please try again.' });
    } finally {
      if (isOrganizationChange) {
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        dispatch({ type: 'SET_INITIAL_LOADING', payload: false });
      }
    }
  };


  const handleDeleteClick = useCallback((departmentId: number, departmentName: string) => {
    dispatch({ type: 'SET_DEPARTMENT_TO_DELETE', payload: { id: departmentId, name: departmentName } });
    dispatch({ type: 'SET_DELETE_SUCCESS', payload: false });
    dispatch({ type: 'SET_SHOW_DELETE_MODAL', payload: true });
  }, []);


  const handleConfirmDelete = async () => {
    if (!state.departmentToDelete) return;

    dispatch({ type: 'SET_IS_DELETING', payload: true });
    try {
      const response = await fetch(`/api/departments/${state.departmentToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        dispatch({ type: 'SET_DELETE_SUCCESS', payload: true });
        // Refresh the list after a short delay to show success state
        setTimeout(() => {
          dispatch({ type: 'SET_SHOW_DELETE_MODAL', payload: false });
          dispatch({ type: 'SET_DEPARTMENT_TO_DELETE', payload: null });
          dispatch({ type: 'SET_DELETE_SUCCESS', payload: false });
          // Refresh with current organization filter
          if (!isSuperAdminMemo && user?.organizationId) {
            fetchDepartments(user.organizationId.toString(), orgFilterCurrentPage);
          } else {
            fetchDepartments(selectedOrganization || undefined, orgFilterCurrentPage);
          }
        }, 1500);
      } else {
        const errorData = await response.json();
        dispatch({ type: 'SET_SHOW_DELETE_MODAL', payload: false });
        dispatch({ type: 'SET_ERROR_MESSAGE', payload: errorData.error || 'Failed to delete department' });
        dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      dispatch({ type: 'SET_SHOW_DELETE_MODAL', payload: false });
      dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'An error occurred while deleting the department' });
      dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
    } finally {
      dispatch({ type: 'SET_IS_DELETING', payload: false });
    }
  };

  if (state.initialLoading) { // display this only on first page load
    return (
      <InitialLoadingScreen
        title="Departments"
        subtitle="Manage departments in your organization"
        loadingText="Loading departments..."
      />
    );
  }

  if (state.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Departments
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage departments in your organization
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
      <PageMeta title='Departments - HR Management System' description='Manage departments' />
      <PageBreadcrumb
        pageTitle='Departments'
        breadcrumbs={[
          { label: 'Departments' }
        ]}
      />

      {/* Content Container */}
      <div className="w-full overflow-x-auto">
        <ComponentCard title="Department Management" size="full">
          {/* Organization Filter - Using reusable component */}
          <RoleComponentWrapper roles={['SUPER_ADMIN']} showFallback={false}>
            <OrganizationFilter
              selectedOrganization={selectedOrganization}
              organizationOptions={organizationOptions}
              onOrganizationChange={handleOrganizationChange}
              disabled={isOrganizationFilterLoading}
            />
          </RoleComponentWrapper>

          {/* Add Department Button */}
          <div className="flex justify-end mb-6">
            <Link
              href="/departments/add"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Department
            </Link>
          </div>

          {/* Desktop Table View */}
          {state.departments.length > 0 && (
            <DepartmentTable departments={state.departments} onDelete={handleDeleteClick} currentPage={state.pagination?.page} limit={state.pagination?.limit} loading={state.initialLoading || state.loading || isOrganizationFilterLoading} />
          )}

          {/* Mobile Card View */}
          {state.departments.length > 0 && (
            <div className={isOrganizationFilterLoading ? 'opacity-50 pointer-events-none' : ''}>
              <DepartmentCardList departments={state.departments} onDelete={handleDeleteClick} />
            </div>
          )}

          {/* Empty State */}
          {!isOrganizationFilterLoading && state.departments.length === 0 && (
            <div className="text-center py-12">
              <Building2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No departments found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedOrganization
                  ? 'No departments in the selected organization.'
                  : 'Get started by adding your first department.'
                }
              </p>
              <Link
                href="/departments/add"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Department
              </Link>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Pagination */}
      <div className={isOrganizationFilterLoading ? 'opacity-50 pointer-events-none' : ''}>
        <Pagination
          pagination={state.pagination}
          currentPage={orgFilterCurrentPage}
          onPageChange={(page) => setOrgFilterCurrentPage(page)}
          itemName="departments"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        size='wider'
        isOpen={state.showDeleteModal}
        onClose={() => {
          if (!state.deleteSuccess) {
            dispatch({ type: 'SET_SHOW_DELETE_MODAL', payload: false });
            dispatch({ type: 'SET_DEPARTMENT_TO_DELETE', payload: null });
          }
        }}
        onConfirm={handleConfirmDelete}
        title={state.deleteSuccess ? "Deleted Successfully" : "Delete Department"}
        message={state.deleteSuccess
          ? `The department "${state.departmentToDelete?.name}" has been deleted successfully.`
          : `Are you sure you want to delete the department "${state.departmentToDelete?.name}"? This action cannot be undone.`
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
