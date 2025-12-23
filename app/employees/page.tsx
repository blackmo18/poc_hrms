'use client';

import { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import Link from 'next/link';
import { PlusIcon, UserIcon } from '@/app/icons';
import ComponentCard from '@/app/components/common/ComponentCard';
import PageMeta from '@/app/components/common/PageMeta';
import PageBreadcrumb from '@/app/components/common/PageBreadCrumb';
import EmployeeCard from '@/app/components/employees/EmployeeCard';
import EmployeeTable, { Employee } from '@/app/components/employees/EmployeeTable';
import Pagination from '@/app/components/ui/pagination';
import RoleComponentWrapper from '@/app/components/common/RoleComponentWrapper';
import { useAuth } from '@/app/components/providers/auth-provider';
import { BadgeColor } from '../components/ui/badge/Badge';

interface Organization {
  id: string;
  name: string;
}

interface ApiResponse {
  data: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface EmployeesState {
  // Data states
  employees: Employee[];
  organizations: Organization[];
  pagination: ApiResponse['pagination'] | null;

  // Loading states
  loading: boolean;
  initialLoading: boolean;
  isOrganizationFilterLoading: boolean;

  // UI states
  selectedOrganization: string | null;
  currentPage: number;
  expandedCards: Set<string>;

  // Error states
  error: string | null;
}

type EmployeesAction =
  // Data actions
  | { type: 'SET_EMPLOYEES'; payload: Employee[] }
  | { type: 'SET_ORGANIZATIONS'; payload: Organization[] }
  | { type: 'SET_PAGINATION'; payload: ApiResponse['pagination'] | null }

  // Loading actions
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIAL_LOADING'; payload: boolean }
  | { type: 'SET_ORGANIZATION_FILTER_LOADING'; payload: boolean }

  // UI actions
  | { type: 'SET_SELECTED_ORGANIZATION'; payload: string | null }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'TOGGLE_CARD_EXPANSION'; payload: string }

  // Error actions
  | { type: 'SET_ERROR'; payload: string | null }

  // Combined actions
  | { type: 'START_LOADING' }
  | { type: 'FINISH_LOADING' }
  | { type: 'START_ORGANIZATION_FILTER'; payload: string | null };

function employeesReducer(state: EmployeesState, action: EmployeesAction): EmployeesState {
  switch (action.type) {
    // Data actions
    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload };
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

    // UI actions
    case 'SET_SELECTED_ORGANIZATION':
      return { ...state, selectedOrganization: action.payload };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'TOGGLE_CARD_EXPANSION': {
      const newExpanded = new Set(state.expandedCards);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return { ...state, expandedCards: newExpanded };
    }

    // Error actions
    case 'SET_ERROR':
      return { ...state, error: action.payload };

    // Combined actions
    case 'START_LOADING':
      return { ...state, loading: true, error: null };
    case 'FINISH_LOADING':
      return { ...state, loading: false, initialLoading: false, isOrganizationFilterLoading: false };
    case 'START_ORGANIZATION_FILTER':
      return { ...state, selectedOrganization: action.payload, currentPage: 1, isOrganizationFilterLoading: true };

    default:
      return state;
  }
}

const initialEmployeesState: EmployeesState = {
  // Data states
  employees: [],
  organizations: [],
  pagination: null,

  // Loading states
  loading: true,
  initialLoading: true,
  isOrganizationFilterLoading: false,

  // UI states
  selectedOrganization: null,
  currentPage: 1,
  expandedCards: new Set(),

  // Error states
  error: null,
};

export default function EmployeesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(employeesReducer, initialEmployeesState);

  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') || user?.role === 'SUPER_ADMIN';

  const fetchEmployees = async (orgId?: string, page: number = 1) => {
    try {
      dispatch({ type: 'START_LOADING' });

      const params = new URLSearchParams();
      if (orgId) params.set('organizationId', orgId.toString());
      params.set('page', page.toString());
      params.set('limit', '15');

      const url = `/api/employees?${params.toString()}`;
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
        throw new Error('Failed to fetch employees');
      }

      const result: ApiResponse = await response.json();
      dispatch({ type: 'SET_EMPLOYEES', payload: result.data });
      dispatch({ type: 'SET_PAGINATION', payload: result.pagination });
    } catch (error) {
      console.error('Error fetching employees:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load employees. Please try again.' });
    } finally {
      dispatch({ type: 'FINISH_LOADING' });
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        dispatch({ type: 'SET_ORGANIZATIONS', payload: (result.data || []).map(org => ({ ...org, id: String(org.id) })) });
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    // For non-super admin, always filter by their organization
    if (!isSuperAdmin && user?.organization_id) {
      fetchEmployees(user.organization_id, state.currentPage);
    } else {
      fetchEmployees(state.selectedOrganization || undefined, state.currentPage);
    }

    // Only fetch organizations for super admin
    if (isSuperAdmin) {
      fetchOrganizations();
    }
  }, [state.selectedOrganization, state.currentPage, authLoading, isSuperAdmin, user?.organization_id]);

  // Memoize expensive calculations to prevent unnecessary re-renders
  const isSuperAdminMemo = useMemo(() =>
    user?.roles?.includes('SUPER_ADMIN') || user?.role === 'SUPER_ADMIN',
    [user?.roles, user?.role]
  );

  const organizationOptions = useMemo(() =>
    state.organizations.map((org) => ({
      value: org.id.toString(),
      label: org.name,
    })),
    [state.organizations]
  );

  // Memoize event handlers to prevent unnecessary re-renders
  const handleOrganizationChange = useCallback((orgId: string | null) => {
    dispatch({ type: 'START_ORGANIZATION_FILTER', payload: orgId });
  }, []);

  const getStatusColor = (status: string): BadgeColor => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'warning';
      case 'TERMINATED':
        return 'error';
      case 'ON_LEAVE':
        return 'info';
      default:
        return 'info';
    }
  };

  const toggleCardExpansion = (empId: string) => {
    dispatch({ type: 'TOGGLE_CARD_EXPANSION', payload: empId });
  };

  // Group employees by organization for admin view
  const employeesByOrganization = useMemo(() => {
    const grouped: { [key: string]: { org: Organization; employees: Employee[] } } = {};

    state.employees.forEach(employee => {
      const orgId = employee.organization.id;
      if (!grouped[orgId]) {
        grouped[orgId] = {
          org: employee.organization,
          employees: []
        };
      }
      grouped[orgId].employees.push(employee);
    });

    return Object.values(grouped);
  }, [state.employees]);

  if (state.initialLoading) { // display this only on first page load
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Employees
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage and view all employees in the system
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading employees...</div>
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
              Employees
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage and view all employees in the system
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
      <PageMeta title='Employees - HR Management System' description='Manage employees' />
      <PageBreadcrumb
        pageTitle='Employees'
        breadcrumbs={[
          { label: 'Employees' }
        ]}
      />

      {/* Content Container */}
      <div className="w-full overflow-x-auto">
        <ComponentCard title="Employee Management" size="full">
          {/* Organization Filter - Only for Super Admin */}
          <RoleComponentWrapper roles={['SUPER_ADMIN']} showFallback={false}>
            <div className="mb-6">
              <label htmlFor="organization-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Organization
              </label>
              <select
                id="organization-select"
                value={state.selectedOrganization || ''}
                onChange={(e) => handleOrganizationChange(e.target.value ? e.target.value : null)}
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

          {/* Add Employee Button */}
          <div className="flex justify-end mb-6">
            <Link
              href="/employees/onboard"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Onboard Employee
            </Link>
          </div>

          {/* Loading Overlay - Only for Organization Filter Changes */}
          {state.isOrganizationFilterLoading && (
            <div className="relative">
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10 rounded-xl">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Loading employees...</span>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Table View */}
          <EmployeeTable employees={state.employees} getStatusColor={getStatusColor} loading={state.isOrganizationFilterLoading} currentPage={state.pagination?.page} limit={state.pagination?.limit} />

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {state.employees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                isExpanded={state.expandedCards.has(employee.id)}
                onToggle={toggleCardExpansion}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>

          {/* Empty State */}
          {!state.isOrganizationFilterLoading && state.employees.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No employees found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {state.selectedOrganization
                  ? 'No employees in the selected organization.'
                  : 'Get started by onboarding your first employee.'
                }
              </p>
              <Link
                href="/employees/onboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Onboard Employee
              </Link>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Pagination */}
      <div className={state.loading ? 'opacity-50 pointer-events-none' : ''}>
        <Pagination
          pagination={state.pagination}
          currentPage={state.currentPage}
          onPageChange={(page) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page })}
          itemName="employees"
        />
      </div>
    </div>
  );
}
