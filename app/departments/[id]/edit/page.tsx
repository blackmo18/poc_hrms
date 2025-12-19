'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import PageBreadcrumb from '@/app/components/common/PageBreadCrumb';
import PageMeta from '@/app/components/common/PageMeta';
import Button from '@/app/components/ui/button/Button';
import Input from '../../../components/form/input/InputField';
import TextArea from '../../../components/form/input/TextArea';
import Label from '../../../components/form/Label';
import { useAuth } from '@/app/components/providers/auth-provider';

interface Department {
  id: number;
  name: string;
  description?: string;
  organization: {
    id: number;
    name: string;
  };
}

export default function EditDepartmentPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const departmentId = params.id as string;

  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && departmentId) {
      fetchDepartment();
    }
  }, [isLoading, user, departmentId, router]);

  const fetchDepartment = async () => {
    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setDepartment(data);
        setFormData({
          name: data.name,
          description: data.description || '',
        });
      } else if (response.status === 404) {
        alert('Department not found');
        router.push('/departments');
      } else {
        const error = await response.json();
        alert(`Failed to load department: ${error.error || 'Unknown error'}`);
        router.push('/departments');
      }
    } catch (error) {
      console.error('Error fetching department:', error);
      alert('An error occurred while loading department');
      router.push('/departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Department updated successfully!');
        router.push('/departments');
      } else {
        const error = await response.json();
        alert(`Failed to update department: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating department:', error);
      alert('An error occurred while updating department');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading department...</div>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-lg mb-2">Error</div>
            <div className="text-gray-600 dark:text-gray-300">Department not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title='Edit Department - HR Management System' description='Edit department details and information' />
      <PageBreadcrumb
        pageTitle='Edit Department'
        breadcrumbs={[
          { label: 'Departments', href: '/departments' },
          { label: 'Edit' }
        ]}
      />

      <div className='rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6'>
        <div className='mb-6'>
          <h3 className='text-lg font-semibold text-gray-800 dark:text-white/90'>
            Edit Department Details
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Update the department information below.
          </p>
          <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
            Organization: {department.organization.name}
          </p>
        </div>

        <form className='space-y-6 mb-7'>
          <div className='grid grid-cols-1 gap-6'>
            <div>
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter department name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <TextArea
                value={formData.description}
                onChange={(value) => handleInputChange('description', value)}
                placeholder="Enter department description"
                rows={3}
              />
            </div>
          </div>
        </form>

        <div className='flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-700'>
          <Link href="/departments">
            <Button
              variant='outline'
              size='md'
              disabled={saving}
            >
              Cancel
            </Button>
          </Link>
          <Button
            variant='primary'
            size='md'
            onClick={() => {
              const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
              handleSubmit(fakeEvent);
            }}
            disabled={saving}
            className='bg-blue-600 hover:bg-blue-700 text-white'
          >
            {saving ? 'Updating...' : 'Update Department'}
          </Button>
        </div>
      </div>
    </>
  );
}
