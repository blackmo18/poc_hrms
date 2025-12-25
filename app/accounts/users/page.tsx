"use client";

import { useState, useEffect, useCallback, useMemo, useReducer } from "react";
import Link from "next/link";
import { useAuth } from "@/app/components/providers/auth-provider";
import { useRoleAccess } from "@/app/components/providers/role-access-provider";
import { PencilIcon, PlusIcon, TrashBinIcon, UserIcon } from "@/app/icons";
import Button from "@/app/components/ui/button/Button";
import Badge, { BadgeColor } from "@/app/components/ui/badge/Badge";
import UserCard from "@/app/components/accounts/UserCard";
import UsersTable from "@/app/components/accounts/UsersTable";
import UsersEmptyState from "@/app/components/accounts/UsersEmptyState";
import Pagination from "@/app/components/ui/pagination/Pagination";
import ComponentCard from "@/app/components/common/ComponentCard";
import PageMeta from "@/app/components/common/PageMeta";
import PageBreadcrumb from "@/app/components/common/PageBreadCrumb";
import RoleComponentWrapper from "@/app/components/common/RoleComponentWrapper";
import OrganizationFilter from "@/app/components/common/OrganizationFilter";
import { useOrganizationFilter } from "@/hooks/useOrganizationFilter";

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  organization: {
    id: string;
    name: string;
  };
  userRoles: {
    role: {
      id: string;
      name: string;
    };
  }[];
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
}

interface ApiResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface UsersState {
  // Data states
  users: User[];
  pagination: ApiResponse['pagination'] | null;

  // Loading states
  loading: boolean;
  initialLoading: boolean;

  // UI states
  expandedCards: Set<string>;

  // Error states
  error: string | null;
}

type UsersAction =
  // Data actions
  | { type: 'SET_USERS'; payload: User[] }
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

function usersReducer(state: UsersState, action: UsersAction): UsersState {
  switch (action.type) {
    // Data actions
    case 'SET_USERS':
      return { ...state, users: action.payload };
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

const initialUsersState: UsersState = {
  // Data states
  users: [],
  pagination: null,

  // Loading states
  loading: true,
  initialLoading: true,

  // UI states
  expandedCards: new Set(),

  // Error states
  error: null,
};

export default function UsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { roles } = useRoleAccess();
  const [state, dispatch] = useReducer(usersReducer, initialUsersState);

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
    apiEndpoint: '/api/users',
    defaultPageSize: 10,
    onDataFetch: async (orgId, page) => {
      await fetchUsers(orgId, page);
    },
  });

  // Memoize super admin check for consistency
  const isSuperAdminMemo = useMemo(() =>
    roles.includes('SUPER_ADMIN'),
    [roles]
  );

  // Fetch users with optional organization filter and pagination
  const fetchUsers = useCallback(async (orgId?: string, page: number = 1) => {
    try {
      dispatch({ type: 'START_LOADING' });

      const params = new URLSearchParams();
      if (orgId) params.set('organizationId', orgId.toString());
      params.set('page', page.toString());
      params.set('limit', '10');

      const url = `/api/users?${params.toString()}`;
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
        throw new Error('Failed to fetch users');
      }

      const result: ApiResponse = await response.json();
      dispatch({ type: 'SET_USERS', payload: result.data });
      dispatch({ type: 'SET_PAGINATION', payload: result.pagination });
    } catch (error) {
      console.error('Error fetching users:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load users. Please try again.' });
    } finally {
      dispatch({ type: 'FINISH_LOADING' });
    }
  }, []);

  useEffect(() => {
    // Organization filtering is now handled by the useOrganizationFilter hook
    // This effect is no longer needed as the hook handles all data fetching
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        dispatch({ type: 'SET_USERS', payload: state.users.filter(user => user.id !== userId) });
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const getStatusColor = (status: string): BadgeColor => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'info';
    }
  };

  const toggleCardExpansion = (userId: string) => {
    dispatch({ type: 'TOGGLE_CARD_EXPANSION', payload: userId });
  };

  if (state.initialLoading) { // display this only on first page load
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Users
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage user accounts and their roles
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading users...</div>
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
              Users
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage user accounts and their roles
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
      <PageMeta title='Users - HR Management System' description='Manage users' />
      <PageBreadcrumb
        pageTitle='Users'
        breadcrumbs={[
          { label: 'Users' }
        ]}
      />

      {/* Content Container */}
      <div className="w-full overflow-x-auto">
        <ComponentCard title="User Management" size="full">
          {/* Organization Filter - Using reusable component */}
          <RoleComponentWrapper roles={['SUPER_ADMIN']} showFallback={false}>
            <OrganizationFilter
              selectedOrganization={selectedOrganization}
              organizationOptions={organizationOptions}
              onOrganizationChange={handleOrganizationChange}
              disabled={isOrganizationFilterLoading}
            />
          </RoleComponentWrapper>

          {/* Add User Button */}
          <div className="flex justify-end mb-6">
            <Link
              href="/accounts/users/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add User
            </Link>
          </div>

          {/* Desktop Table View */}
          <UsersTable users={state.users} getStatusColor={getStatusColor} loading={isOrganizationFilterLoading} onDelete={handleDeleteUser} currentPage={state.pagination?.page} limit={state.pagination?.limit} />

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {state.users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isExpanded={state.expandedCards.has(user.id)}
                onToggle={toggleCardExpansion}
                getStatusColor={getStatusColor}
                onDelete={handleDeleteUser}
              />
            ))}
          </div>

          {/* Empty State */}
          {!isOrganizationFilterLoading && state.users.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedOrganization
                  ? 'No users in the selected organization.'
                  : 'Get started by adding your first user.'
                }
              </p>
              <Link
                href="/accounts/users/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add User
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
          itemName="users"
        />
      </div>
    </div>
  );
}
