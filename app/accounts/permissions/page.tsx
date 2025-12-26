"use client";

import { useState, useEffect, useMemo, useCallback, useReducer } from "react";
import Link from "next/link";
import { PencilIcon, PlusIcon, TrashBinIcon, EyeIcon, LockIcon } from "@/app/icons";
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
import PermissionsTable from '@/app/components/accounts/PermissionsTable';
import PermissionCard from '@/app/components/accounts/PermissionCard';

interface Permission {
  id: string;
  name: string;
  description: string;
  organization: {
    id: string;
    name: string;
  } | null;
  rolePermissions: {
    role: {
      id: string;
      name: string;
    };
  }[];
  created_at: string;
}

interface ApiResponse {
  data: Permission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface PermissionsState {
  // Data states
  permissions: Permission[];
  pagination: ApiResponse['pagination'] | null;

  // Loading states
  loading: boolean;
  initialLoading: boolean;

  // UI states
  expandedCards: Set<string>;

  // Error states
  error: string | null;
}

type PermissionsAction =
  // Data actions
  | { type: 'SET_PERMISSIONS'; payload: Permission[] }
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

function permissionsReducer(state: PermissionsState, action: PermissionsAction): PermissionsState {
  switch (action.type) {
    // Data actions
    case 'SET_PERMISSIONS':
      return { ...state, permissions: action.payload };
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

const initialPermissionsState: PermissionsState = {
  // Data states
  permissions: [],
  pagination: null,

  // Loading states
  loading: true,
  initialLoading: true,

  // UI states
  expandedCards: new Set(),

  // Error states
  error: null,
};

export default function PermissionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { roles } = useRoleAccess();
  const [state, dispatch] = useReducer(permissionsReducer, initialPermissionsState);

  // Use the reusable organization filter hook
  const {
    selectedOrganization,
    isOrganizationFilterLoading,
    currentPage: orgFilterCurrentPage,
    handleOrganizationChange,
    setCurrentPage: setOrgFilterCurrentPage,
    organizationOptions,
  } = useOrganizationFilter({
    apiEndpoint: '/api/permissions',
    defaultPageSize: 15,
    onDataFetch: async (orgId, page) => {
      await fetchPermissions(orgId, page);
    },
  });

  const fetchPermissions = async (orgId?: string, page: number = 1) => {
    try {
      dispatch({ type: 'START_LOADING' });

      const params = new URLSearchParams();
      if (orgId) params.set('organizationId', orgId.toString());
      params.set('page', page.toString());
      params.set('limit', '15');

      const url = `/api/permissions?${params.toString()}`;
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
        throw new Error('Failed to fetch permissions');
      }

      const result: ApiResponse = await response.json();
      dispatch({ type: 'SET_PERMISSIONS', payload: result.data || [] });
      dispatch({ type: 'SET_PAGINATION', payload: result.pagination });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load permissions. Please try again.' });
    } finally {
      dispatch({ type: 'FINISH_LOADING' });
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (!confirm('Are you sure you want to delete this permission? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/permissions/${permissionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Refresh the permissions list
        await fetchPermissions(selectedOrganization, orgFilterCurrentPage);
      } else {
        alert('Failed to delete permission');
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
      alert('Failed to delete permission');
    }
  };

  const toggleCardExpansion = (permissionId: string) => {
    dispatch({ type: 'TOGGLE_CARD_EXPANSION', payload: permissionId });
  };

  if (state.initialLoading) { // display this only on first page load
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Permissions
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage system permissions and their assignments
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading permissions...</div>
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
              Permissions
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage system permissions and their assignments
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
      <PageMeta title='Permissions - HR Management System' description='Manage permissions and assignments' />
      <PageBreadcrumb
        pageTitle='Permissions'
        breadcrumbs={[
          { label: 'Permissions' }
        ]}
      />

      {/* Content Container */}
      <div className="w-full overflow-x-auto">
        <ComponentCard title="Permission Management" size="full">
          {/* Organization Filter - Using reusable component */}
          <RoleComponentWrapper roles={['SUPER_ADMIN']} showFallback={false}>
            <OrganizationFilter
              selectedOrganization={selectedOrganization}
              organizationOptions={organizationOptions}
              onOrganizationChange={handleOrganizationChange}
              disabled={isOrganizationFilterLoading}
            />
          </RoleComponentWrapper>

          {/* Add Permission Button */}
          <div className="flex justify-end mb-6">
            <Link
              href="/accounts/permissions/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Permission
            </Link>
          </div>

          {/* Desktop Table View */}
          <PermissionsTable
            permissions={state.permissions}
            loading={state.initialLoading || state.loading || isOrganizationFilterLoading}
            currentPage={state.pagination?.page}
            limit={state.pagination?.limit}
            onDeletePermission={handleDeletePermission}
          />

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {state.permissions.map((permission) => (
              <PermissionCard
                key={permission.id}
                permission={permission}
                isExpanded={state.expandedCards.has(permission.id)}
                onToggle={toggleCardExpansion}
              />
            ))}
          </div>

          {/* Empty State */}
          {!isOrganizationFilterLoading && state.permissions.length === 0 && !state.loading && (
            <div className="text-center py-12">
              <LockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No permissions found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedOrganization
                  ? 'No permissions in the selected organization.'
                  : 'Get started by creating your first permission.'
                }
              </p>
              <Link
                href="/accounts/permissions/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Permission
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
          itemName="permissions"
        />
      </div>
    </div>
  );
}
