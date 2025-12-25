"use client";

import { useState, useEffect, useMemo, useCallback, useReducer } from "react";
import Link from "next/link";
import { PencilIcon, PlusIcon, TrashBinIcon, EyeIcon, UserGroupIcon } from "@/app/icons";
import Button from "@/app/components/ui/button/Button";
import ComponentCard from '@/app/components/common/ComponentCard';
import PageMeta from '@/app/components/common/PageMeta';
import PageBreadcrumb from '@/app/components/common/PageBreadCrumb';
import Pagination from '@/app/components/ui/pagination';
import RoleComponentWrapper from '@/app/components/common/RoleComponentWrapper';
import OrganizationFilter from '@/app/components/common/OrganizationFilter';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { useAuth } from '@/app/components/providers/auth-provider';
import { useRoleAccess } from '@/app/components/providers/role-access-provider';
import RoleCard from '@/app/components/accounts/RoleCard';
import RolesTable from '@/app/components/accounts/RolesTable';

interface Role {
  id: string;
  name: string;
  description: string;
  organization: {
    id: string;
    name: string;
  };
  rolePermissions: {
    id: string;
    permission: {
      id: string;
      name: string;
    };
  }[];
  userRoles: {
    id: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  }[];
  created_at: string;
}

interface ApiResponse {
  data: Role[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface RolesState {
  // Data states
  roles: Role[];
  pagination: ApiResponse['pagination'] | null;

  // Loading states
  loading: boolean;
  initialLoading: boolean;

  // UI states
  expandedCards: Set<string>;

  // Error states
  error: string | null;
}

type RolesAction =
  // Data actions
  | { type: 'SET_ROLES'; payload: Role[] }
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

function rolesReducer(state: RolesState, action: RolesAction): RolesState {
  switch (action.type) {
    // Data actions
    case 'SET_ROLES':
      return { ...state, roles: action.payload };
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

const initialRolesState: RolesState = {
  // Data states
  roles: [],
  pagination: null,

  // Loading states
  loading: true,
  initialLoading: true,

  // UI states
  expandedCards: new Set(),

  // Error states
  error: null,
};

export default function RolesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { roles } = useRoleAccess();
  const [state, dispatch] = useReducer(rolesReducer, initialRolesState);

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
    apiEndpoint: '/api/roles',
    defaultPageSize: 15,
    onDataFetch: async (orgId, page) => {
      await fetchRoles(orgId, page);
    },
  });

  // Memoize super admin check for consistency
  const isSuperAdminMemo = useMemo(() =>
    roles.includes('SUPER_ADMIN'),
    [roles]
  );

  const fetchRoles = async (orgId?: string, page: number = 1) => {
    try {
      dispatch({ type: 'START_LOADING' });

      const params = new URLSearchParams();
      if (orgId) params.set('organizationId', orgId.toString());
      params.set('page', page.toString());
      params.set('limit', '15');

      const url = `/api/roles?${params.toString()}`;
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
        throw new Error('Failed to fetch roles');
      }

      const result: ApiResponse = await response.json();
      dispatch({ type: 'SET_ROLES', payload: result.data || [] });
      dispatch({ type: 'SET_PAGINATION', payload: result.pagination });
    } catch (error) {
      console.error('Error fetching roles:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load roles. Please try again.' });
    } finally {
      dispatch({ type: 'FINISH_LOADING' });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Refresh the roles list
        await fetchRoles(selectedOrganization, orgFilterCurrentPage);
      } else {
        alert('Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Failed to delete role');
    }
  };

  if (state.initialLoading) { // display this only on first page load
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Roles
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage user roles and their permissions
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading roles...</div>
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
              Roles
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage user roles and their permissions
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

  const toggleCardExpansion = (roleId: string) => {
    dispatch({ type: 'TOGGLE_CARD_EXPANSION', payload: roleId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageMeta title='Roles - HR Management System' description='Manage roles and permissions' />
      <PageBreadcrumb
        pageTitle='Roles'
        breadcrumbs={[
          { label: 'Roles' }
        ]}
      />

      {/* Content Container */}
      <div className="w-full overflow-x-auto">
        <ComponentCard title="Role Management" size="full">
          {/* Organization Filter - Using reusable component */}
          <RoleComponentWrapper roles={['SUPER_ADMIN']} showFallback={false}>
            <OrganizationFilter
              selectedOrganization={selectedOrganization}
              organizationOptions={organizationOptions}
              onOrganizationChange={handleOrganizationChange}
              disabled={isOrganizationFilterLoading}
            />
          </RoleComponentWrapper>

          {/* Add Role Button */}
          <div className="flex justify-end mb-6">
            <Link
              href="/accounts/roles/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Role
            </Link>
          </div>

          {/* Desktop Table View */}
          <RolesTable
            roles={state.roles}
            loading={isOrganizationFilterLoading}
            currentPage={state.pagination?.page}
            limit={state.pagination?.limit}
            onDeleteRole={handleDeleteRole}
          />

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {state.roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                isExpanded={state.expandedCards.has(role.id)}
                onToggle={toggleCardExpansion}
              />
            ))}
          </div>

          {/* Empty State */}
          {!isOrganizationFilterLoading && state.roles.length === 0 && !state.loading && (
            <div className="text-center py-12">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No roles found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedOrganization
                  ? 'No roles in the selected organization.'
                  : 'Get started by creating your first role.'
                }
              </p>
              <Link
                href="/accounts/roles/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Role
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
          itemName="roles"
        />
      </div>
    </div>
  );
}
