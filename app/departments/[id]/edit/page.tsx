'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
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
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/departments"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Back to Departments
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Department</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Organization: {department.organization.name}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Department Name</Label>
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

              <div className="flex space-x-4 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Updating...' : 'Update Department'}
                </Button>
                <Link href="/departments">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
