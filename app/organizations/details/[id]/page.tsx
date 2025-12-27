'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Organization } from '@/lib/models';
import ComponentCard from '@/components/common/ComponentCard';
import RoleComponentWrapper from '@/components/common/RoleComponentWrapper';
import OrganizationNameCard from '@/components/organizations/OrgnizationNameCard';
import GeneralInfoCard from '@/components/profiles/general/GeneralInfoCard';
import PageMeta from '@/components/common/PageMeta';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';


const OrganizationPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleEditClick = () => {
    router.push(`/organizations/details/${id}/edit`);
  };

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
      <PageMeta
        title="Organization Details"
        description="View detailed information about this organization"
      />
      <PageBreadcrumb pageTitle="Details" />
      <RoleComponentWrapper roles={['ADMIN', 'SUPER_ADMIN']}>
        <ComponentCard title={organization.name}>
          <OrganizationNameCard
            name={organization.name}
            email={organization.email || ""}
            phone={organization.contact_number || ""}
            description={organization.description || ""}
            website={organization.website || ""}
            socialMedias={[]} // Could be added to the organization model later
            editClick={handleEditClick}
          />
          <GeneralInfoCard
            id={organization.id.toString()}
            name={organization.name}
            address={organization.address || ""}
            createdDate={organization.created_at}
            updatedDate={organization.updated_at}
            status={organization.status}
          />
        </ComponentCard>
      </RoleComponentWrapper>
    </div>
  );
};

export default OrganizationPage;