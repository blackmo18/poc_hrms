'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import Input from '../../components/form/input/InputField';
import TextArea from '../../components/form/input/TextArea';
import Label from '../../components/form/Label';
import Select from '../../components/form/Select';
import { useAuth } from '@/app/components/providers/auth-provider';

interface Organization {
  id: number;
  name: string;
}

export default function AddDepartmentPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    organization_id: '',
    name: '',
    description: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user) {
      fetchOrganizations();
    }
  }, [isLoading, user, router]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setOrganizations(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Department created successfully!');
        router.push('/departments');
      } else {
        const error = await response.json();
        alert(`Failed to create department: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating department:', error);
      alert('An error occurred while creating department');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

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
            <CardTitle>Add New Department</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="organization">Organization</Label>
                <Select
                  options={organizations.map(org => ({ value: org.id.toString(), label: org.name }))}
                  placeholder="Select organization"
                  onChange={(value) => handleInputChange('organization_id', value)}
                  value={formData.organization_id}
                  required
                />
              </div>

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
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Department'}
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
