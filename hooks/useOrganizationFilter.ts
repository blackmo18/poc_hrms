import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRoleAccess } from '@/components/providers/role-access-provider';

export interface Organization {
  id: string;
  name: string;
}

export interface OrganizationFilterState {
  selectedOrganization: string | null;
  organizations: Organization[];
  isOrganizationFilterLoading: boolean;
  currentPage: number;
}

export interface OrganizationFilterActions {
  setSelectedOrganization: (orgId: string | null) => void;
  setCurrentPage: (page: number) => void;
  handleOrganizationChange: (orgId: string | null) => void;
  fetchOrganizations: () => Promise<void>;
}

export interface UseOrganizationFilterOptions {
  apiEndpoint: string;
  defaultPageSize?: number;
  onDataFetch?: (orgId?: string, page?: number, isOrgChange?: boolean) => Promise<void>;
  enabled?: boolean;
}

export interface UseOrganizationFilterReturn extends OrganizationFilterState, OrganizationFilterActions {
  isSuperAdmin: boolean;
  organizationOptions: Array<{ value: string; label: string }>;
}

/**
 * Reusable hook for organization filtering functionality
 * Handles state management, API calls, and UI logic for organization-based filtering
 */
export function useOrganizationFilter(options: UseOrganizationFilterOptions): UseOrganizationFilterReturn {
  const { apiEndpoint, defaultPageSize = 15, onDataFetch, enabled = true } = options;
  const { user, isLoading: authLoading } = useAuth();
  const { roles } = useRoleAccess();

  // State
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isOrganizationFilterLoading, setIsOrganizationFilterLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Use ref to store the latest onDataFetch callback
  const onDataFetchRef = useRef(onDataFetch);
  
  // Use ref to track if the current data fetch is due to organization change
  const isOrgChangeRef = useRef(false);
  
  // Update ref when onDataFetch changes
  useEffect(() => {
    onDataFetchRef.current = onDataFetch;
  }, [onDataFetch]);

  const isSuperAdmin = useMemo(() =>
    roles.includes('SUPER_ADMIN'),
    [roles]
  );

  // Organization options for Select component
  const organizationOptions = useMemo(() =>
    organizations.map((org) => ({
      value: org.id.toString(),
      label: org.name,
    })),
    [organizations]
  );

  // Fetch organizations for super admin
  const fetchOrganizations = useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await fetch('/api/organizations', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setOrganizations((result.data || []).map((org: any) => ({
          ...org,
          id: String(org.id)
        })));
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  }, [enabled]);

  // Handle organization change with loading state
  const handleOrganizationChange = useCallback((orgId: string | null) => {
    isOrgChangeRef.current = true;
    setSelectedOrganization(orgId);
    setCurrentPage(1); // Reset to first page when changing organization
    setIsOrganizationFilterLoading(true);
    
    // The data fetch will be handled by the effect below
    // We'll set a timeout to clear the loading state in case the effect doesn't trigger
    setTimeout(() => {
      setIsOrganizationFilterLoading(false);
    }, 100);
  }, []);

  // Initial data fetch and organization fetching
  useEffect(() => {
    if (authLoading || !enabled) return;

    // Only fetch organizations for super admin
    if (isSuperAdmin && organizations.length === 0) {
      fetchOrganizations();
    }
  }, [
    authLoading,
    enabled,
    isSuperAdmin,
    organizations.length,
    fetchOrganizations
  ]);

  // Handle data fetch for organization and page changes
  useEffect(() => {
    if (authLoading || !enabled) return;

    if (onDataFetchRef.current) {
      const orgId = !isSuperAdmin && user?.organization_id 
        ? user.organization_id 
        : selectedOrganization || undefined;
      
      if (orgId !== undefined || isSuperAdmin) {
        onDataFetchRef.current(orgId, currentPage, isOrgChangeRef.current);
        isOrgChangeRef.current = false;
      }
    }
  }, [currentPage, selectedOrganization, authLoading, enabled, isSuperAdmin, user?.organization_id]);

  return {
    // State
    selectedOrganization,
    organizations,
    isOrganizationFilterLoading,
    currentPage,

    // Actions
    setSelectedOrganization,
    setCurrentPage,
    handleOrganizationChange,
    fetchOrganizations,

    // Computed
    isSuperAdmin,
    organizationOptions,
  };
}
