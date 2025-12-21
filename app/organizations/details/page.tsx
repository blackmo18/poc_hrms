'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import Badge, { BadgeColor } from '../../components/ui/badge/Badge';
import { PencilIcon } from '../../icons';
import RoleComponentWrapper from '@/app/components/common/RoleComponentWrapper';
import ComponentCard from '@/app/components/common/ComponentCard';
import PageMeta from '@/app/components/common/PageMeta';
import PageBreadcrumb from '@/app/components/common/PageBreadCrumb';
import OrganizationCard from '../../components/organizations/OrganizationCard';
import OrganizationTable from '../../components/organizations/OrganizationTable';
import Pagination from '../../components/ui/pagination';

interface Organization {
  id: number;
  name: string;
  email?: string;
  contact_number?: string;
  address?: string;
  logo?: string;
  website?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse {
  data: Organization[];
  pagination: PaginationInfo;
}

export default function OrganizationDetailsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const fetchOrganizations = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/organizations?page=${page}&limit=15`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        setError('Unauthorized access. Admin role required.');
        return;
      }

      if (response.status === 403) {
        setError('Admin access required to view organizations.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const result: ApiResponse = await response.json();
      setOrganizations(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError('Failed to load organizations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations(currentPage);
  }, [currentPage]);

  const getStatusColor = (status: string): BadgeColor => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'warning';
      case 'SUSPENDED':
        return 'error';
      default:
        return 'info';
    }
  };

  const toggleCardExpansion = (orgId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId);
    } else {
      newExpanded.add(orgId);
    }
    setExpandedCards(newExpanded);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Organization Details
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage and view all organizations in the system
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading organizations...</div>
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
              Organization Details
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage and view all organizations in the system
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
      <PageMeta title='Organization Onboarding - HR Management System' description='Create a new organization' />
      <PageBreadcrumb
        pageTitle='Organization Details'
        breadcrumbs={[
          { label: 'Details' }
        ]}
      />

      {/* Content Container */}
      <div className="w-full overflow-x-auto">
        <ComponentCard title="Organization Details" size="full">
          <RoleComponentWrapper roles={['ADMIN', 'SUPER_ADMIN']}>

            {/* Desktop Table View */}
            <OrganizationTable organizations={organizations} getStatusColor={getStatusColor} />

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {organizations.map((org) => (
                <OrganizationCard
                  key={org.id}
                  org={org}
                  isExpanded={expandedCards.has(org.id)}
                  onToggle={toggleCardExpansion}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>

          </RoleComponentWrapper>
        </ComponentCard>
      </div>

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        itemName="organizations"
      />
    </div>
  );
}