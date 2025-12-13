'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ComponentCard from '@/app/components/common/ComponentCard';
import Badge from '@/app/components/ui/badge/Badge';
import RoleComponentWrapper from '@/app/components/common/RoleComponentWrapper';
import NameMetaCard from '@/app/components/profiles/header/NameMetaCard';

interface Organization {
  id: number;
  name: string;
  address?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const OrganizationPage = () => {
  const params = useParams();
  const id = params.id as string;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/organizations/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch organization');
        }
        const data = await response.json();
        setOrganization(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrganization();
    }
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'warning';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg mb-2">Error</div>
          <div className="text-gray-600 dark:text-gray-300">{error}</div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-300">Organization not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Organization Details
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            View detailed information about this organization
          </p>
        </div>
      </div>

      <RoleComponentWrapper roles={['ADMIN']}>
        <ComponentCard title={organization.name}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">ID</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{organization.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{organization.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{organization.address || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <div className="mt-1">
                    <Badge size="sm" color={getStatusColor(organization.status)}>
                      {organization.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Timestamps</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Created Date</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(organization.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(organization.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ComponentCard>
      </RoleComponentWrapper>
      <NameMetaCard />
    </div>
  );
};

export default OrganizationPage;