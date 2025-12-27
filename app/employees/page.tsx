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
import { useRoleAccess } from '@/app/components/providers/role-access-provider';
import { BadgeColor } from '../components/ui/badge/Badge';
import Select from '../components/form/Select';
import OrganizationFilter from '@/app/components/common/OrganizationFilter';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import InitialLoadingScreen from '@/app/components/common/InitialLoadingScreen';

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
  pagination: ApiResponse['pagination'] | null;

  // Loading states
  loading: boolean;
  initialLoading: boolean;

  // UI states
  expandedCards: Set<string>;

  // Error states
  error: string | null;
}

type EmployeesAction =
  // Data actions
  | { type: 'SET_EMPLOYEES'; payload: Employee[] }
  | { type: 'SET_PAGINATION'; payload: ApiResponse['pagination'] | null }

  // Loading actions
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIAL_LOADING'; payload: boolean }

  // UI actions
  | { type: 'TOGGLE_CARD_EXPANSION'; payload: string }

  // Error actions
  | { type: 'SET_ERROR'; payload: string | null }

  // Combined actions
  | { type: 'START_LOADING' }
  | { type: 'FINISH_LOADING' };

function employeesReducer(state: EmployeesState, action: EmployeesAction): EmployeesState {
  switch (action.type) {
    // Data actions
    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload };
    case 'SET_PAGINATION':
      return { ...state, pagination: action.payload };

    // Loading actions
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_INITIAL_LOADING':
      return { ...state, initialLoading: action.payload };

    // UI actions
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
      return { ...state, loading: false, initialLoading: false };

    default:
      return state;
  }
}

const initialEmployeesState: EmployeesState = {
  // Data states
  employees: [],
  pagination: null,

  // Loading states
  loading: true,
  initialLoading: true,

  // UI states
  expandedCards: new Set(),

  // Error states
  error: null,
};

export default function EmployeesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { roles } = useRoleAccess();
  const [state, dispatch] = useReducer(employeesReducer, initialEmployeesState);

  // Use the reusable organization filter hook
  const {
    selectedOrganization,
    organizations,
    isOrganizationFilterLoading,
    currentPage: orgFilterCurrentPage,
    handleOrganizationChange,
    setCurrentPage: setOrgFilterCurrentPage,
    isSuperAdmin,
    organizationOptions,
  } = useOrganizationFilter({
    apiEndpoint: '/api/employees',
    defaultPageSize: 15,
    onDataFetch: async (orgId, page, isOrgChange = false) => {
      await fetchEmployees(orgId, page);
    },
  });

  // Memoize super admin check for consistency
  const isSuperAdminMemo = useMemo(() =>
    roles.includes('SUPER_ADMIN'),
    [roles]
  );

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
      <InitialLoadingScreen
        title="Employees"
        subtitle="Manage and view all employees in the system"
        loadingText="Loading employees..."
      />
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
          {/* Organization Filter - Using reusable component */}
          <RoleComponentWrapper roles={['SUPER_ADMIN']} showFallback={false}>
            <OrganizationFilter
              selectedOrganization={selectedOrganization}
              organizationOptions={organizationOptions}
              onOrganizationChange={handleOrganizationChange}
              disabled={isOrganizationFilterLoading}
            />
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

          {/* Desktop Table View */}
          <EmployeeTable employees={state.employees} getStatusColor={getStatusColor} loading={state.initialLoading || state.loading || isOrganizationFilterLoading} currentPage={state.pagination?.page} limit={state.pagination?.limit} />

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
          {!isOrganizationFilterLoading && state.employees.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No employees found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedOrganization
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
          currentPage={orgFilterCurrentPage}
          onPageChange={(page) => setOrgFilterCurrentPage(page)}
          itemName="employees"
        />
      </div>
    </div>
  );
}
