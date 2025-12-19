'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import Input from '@/app/components/form/input/InputField';
import Label from '@/app/components/form/Label';
import Select from '@/app/components/form/Select';
import { useAuth } from '@/app/components/providers/auth-provider';

interface Organization {
  id: number;
  name: string;
  email: string;
}

const AdminOnboardingPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    organization_id: '',
    first_name: '',
    last_name: '',
    work_email: '',
    work_contact: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    // Check if user is super admin
    if (!isLoading && user) {
      checkSuperAdmin();
      fetchOrganizations();
    }
  }, [isLoading, user, router]);

  const checkSuperAdmin = async () => {
    try {
      const response = await fetch('/api/auth/check-role');
      const data = await response.json();
      if (!data.isSuperAdmin) {
        alert('Access denied. Super admin required.');
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error checking role:', error);
      router.push('/dashboard');
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      if (response.ok) {
        const data = await response.json();
        // Filter out system organization
        setOrganizations(data.filter((org: Organization) => org.name !== 'System'));
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Admin onboarded successfully!');
        setFormData({
          organization_id: '',
          first_name: '',
          last_name: '',
          work_email: '',
          work_contact: '',
        });
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to onboard admin');
      }
    } catch (error) {
      console.error('Error onboarding admin:', error);
      alert('An error occurred while onboarding admin');
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
        <Card>
          <CardHeader>
            <CardTitle>Onboard Organization Admin</CardTitle>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="work_email">Work Email</Label>
                <Input
                  id="work_email"
                  type="email"
                  value={formData.work_email}
                  onChange={(e) => handleInputChange('work_email', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="work_contact">Work Contact Number</Label>
                <Input
                  id="work_contact"
                  type="tel"
                  value={formData.work_contact}
                  onChange={(e) => handleInputChange('work_contact', e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed opacity-50 inline-flex items-center justify-center gap-2 rounded-lg transition"
              >
                {loading ? 'Onboarding...' : 'Onboard Admin'}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOnboardingPage;
