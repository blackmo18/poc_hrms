'use client';

import { useState, useEffect } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgeColor } from "@/components/ui/badge/Badge";
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import { PlusIcon, EditIcon, TrashIcon, ClockIcon, AlertCircleIcon } from 'lucide-react';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import { Input } from '@/components/form/input/Input';
import { Label } from '@/components/form/Label';
import { Select } from '@/components/form/Select';
import { Textarea } from '@/components/form/input/Textarea';
import { Switch } from '@/components/form/switch/Switch';
import OrganizationFilter from '@/components/common/OrganizationFilter';
import RoleComponentWrapper from '@/components/common/RoleComponentWrapper';
import { useAuth } from '@/components/providers/auth-provider';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';

interface DeductionPolicy {
  id: string;
  name: string;
  type: 'LATE' | 'UNDERTIME' | 'ABSENCE';
  deductionMethod: 'FIXED_AMOUNT' | 'HOURLY_RATE' | 'PERCENTAGE';
  rate: number;
  gracePeriodMinutes: number;
  maxDeductionPerDay: number;
  description: string;
  isActive: boolean;
  organizationId: string;
  organizationName: string;
  createdAt: string;
  updatedAt: string;
}

function DeductionPoliciesContent() {
  const [policies, setPolicies] = useState<DeductionPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<DeductionPolicy | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'LATE' as 'LATE' | 'UNDERTIME' | 'ABSENCE',
    deductionMethod: 'HOURLY_RATE' as 'HOURLY_RATE' | 'FIXED_AMOUNT' | 'PERCENTAGE',
    rate: 0,
    gracePeriodMinutes: 0,
    maxDeductionPerDay: 0,
    description: '',
    isActive: true,
  });
  
  const { user } = useAuth();
  
  // Use the reusable organization filter hook
  const {
    selectedOrganization,
    organizationOptions,
    isOrganizationFilterLoading,
    handleOrganizationChange,
    isSuperAdmin,
    showAllOption,
  } = useOrganizationFilter({
    apiEndpoint: '/api/deduction-policies',
    enabled: true,
    showAllOption: false
  });

  // Mock data
  const mockPolicies: DeductionPolicy[] = [
    {
      id: '1',
      name: 'Late Arrival Policy',
      type: 'LATE',
      deductionMethod: 'HOURLY_RATE',
      rate: 0.5,
      gracePeriodMinutes: 5,
      maxDeductionPerDay: 500,
      description: 'Deducts half of hourly rate for every minute late after 5-minute grace period',
      isActive: true,
      organizationId: user?.organization_id || '1',
      organizationName: 'Tech Corp',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Undertime Policy',
      type: 'UNDERTIME',
      deductionMethod: 'HOURLY_RATE',
      rate: 1,
      gracePeriodMinutes: 0,
      maxDeductionPerDay: 1000,
      description: 'Deducts full hourly rate for every minute of undertime',
      isActive: true,
      organizationId: user?.organization_id || '1',
      organizationName: 'Tech Corp',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '3',
      name: 'Absence Policy',
      type: 'ABSENCE',
      deductionMethod: 'FIXED_AMOUNT',
      rate: 1000,
      gracePeriodMinutes: 0,
      maxDeductionPerDay: 1000,
      description: 'Fixed deduction of ₱1000 for each day of absence',
      isActive: true,
      organizationId: user?.organization_id || '1',
      organizationName: 'Tech Corp',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPolicies(mockPolicies);
      setIsLoading(false);
    }, 1000);
  }, [selectedOrganization]);

  const handleCreatePolicy = () => {
    // TODO: Implement API call
    const newPolicy: DeductionPolicy = {
      id: Date.now().toString(),
      ...formData,
      organizationId: selectedOrganization || user?.organization_id || '1',
      organizationName: 'Tech Corp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPolicies([...policies, newPolicy]);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleUpdatePolicy = () => {
    // TODO: Implement API call
    if (!editingPolicy) return;
    
    setPolicies(policies.map(p => 
      p.id === editingPolicy.id 
        ? { ...p, ...formData, updatedAt: new Date().toISOString() }
        : p
    ));
    setEditingPolicy(null);
    resetForm();
  };

  const handleDeletePolicy = (id: string) => {
    setPolicyToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeletePolicy = () => {
    if (policyToDelete) {
      setPolicies(policies.filter(p => p.id !== policyToDelete));
      setPolicyToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleTogglePolicy = (id: string) => {
    // TODO: Implement API call
    setPolicies(policies.map(p => 
      p.id === id 
        ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() }
        : p
    ));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'LATE',
      deductionMethod: 'HOURLY_RATE',
      rate: 0,
      gracePeriodMinutes: 0,
      maxDeductionPerDay: 0,
      description: '',
      isActive: true,
    });
  };

  const openEditDialog = (policy: DeductionPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      type: policy.type,
      deductionMethod: policy.deductionMethod,
      rate: policy.rate,
      gracePeriodMinutes: policy.gracePeriodMinutes,
      maxDeductionPerDay: policy.maxDeductionPerDay,
      description: policy.description,
      isActive: policy.isActive,
    });
  };

  const formatRate = (method: string, rate: number) => {
    switch (method) {
      case 'HOURLY_RATE': return `${rate}x hourly rate`;
      case 'PERCENTAGE': return `${rate}% of daily rate`;
      case 'FIXED_AMOUNT': return `₱${rate.toLocaleString()}`;
      default: return rate.toString();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb pageTitle="Deduction Policies" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deduction Policies</h1>
            <p className="text-gray-600 mt-1">Manage policies for late arrival, undertime, and absence deductions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Add Policy
            </Button>
          </div>
        </div>

        {/* Organization Filter */}
        <RoleComponentWrapper roles={ADMINSTRATIVE_ROLES} showFallback={false}>
          <div className="mb-6">
            <OrganizationFilter
              selectedOrganization={selectedOrganization}
              organizationOptions={organizationOptions}
              onOrganizationChange={handleOrganizationChange}
              disabled={isOrganizationFilterLoading}
              showAllOption={showAllOption}
            />
          </div>
        </RoleComponentWrapper>

        {/* Policies List */}
        <div className="space-y-4">
          {policies.map((policy) => (
            <Card key={policy.id} className={!policy.isActive ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{policy.name}</h3>
                      <BadgeColor color={policy.type === 'LATE' ? 'yellow' : policy.type === 'UNDERTIME' ? 'orange' : 'red'}>
                        {policy.type}
                      </BadgeColor>
                      {!policy.isActive && (
                        <BadgeColor color="gray">
                          Inactive
                        </BadgeColor>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{policy.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500">Deduction Rate</p>
                          <p className="font-medium">{formatRate(policy.deductionMethod, policy.rate)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <AlertCircleIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500">Grace Period</p>
                          <p className="font-medium">{policy.gracePeriodMinutes} minutes</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Max Daily Deduction</p>
                        <p className="font-medium">₱{policy.maxDeductionPerDay.toLocaleString()}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Organization</p>
                        <p className="font-medium">{policy.organizationName}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePolicy(policy.id)}
                    >
                      {policy.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(policy)}
                    >
                      <EditIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePolicy(policy.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {policies.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">No deduction policies found.</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                    Create your first policy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <ConfirmationModal
        isOpen={isCreateDialogOpen || editingPolicy !== null}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingPolicy(null);
          resetForm();
        }}
        onConfirm={editingPolicy ? handleUpdatePolicy : handleCreatePolicy}
        title={editingPolicy ? 'Edit Policy' : 'Create New Policy'}
        message=""
        confirmText={editingPolicy ? 'Update' : 'Create'}
        cancelText="Cancel"
        type="info"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Policy Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Late Arrival Policy"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Policy Type</Label>
              <Select
                value={formData.type}
                onChange={(value: any) => setFormData({ ...formData, type: value })}
                options={[
                  { value: 'LATE', label: 'Late' },
                  { value: 'UNDERTIME', label: 'Undertime' },
                  { value: 'ABSENCE', label: 'Absence' },
                ]}
                placeholder="Select type"
              />
            </div>
            
            <div>
              <Label htmlFor="method">Deduction Method</Label>
              <Select
                value={formData.deductionMethod}
                onChange={(value: any) => setFormData({ ...formData, deductionMethod: value })}
                options={[
                  { value: 'HOURLY_RATE', label: 'Hourly Rate' },
                  { value: 'PERCENTAGE', label: 'Percentage' },
                  { value: 'FIXED_AMOUNT', label: 'Fixed Amount' },
                ]}
                placeholder="Select method"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rate">
                Rate {formData.deductionMethod === 'HOURLY_RATE' ? '(multiplier)' : 
                      formData.deductionMethod === 'PERCENTAGE' ? '(%)' : '(₱)'}
              </Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="gracePeriod">Grace Period (minutes)</Label>
              <Input
                id="gracePeriod"
                type="number"
                value={formData.gracePeriodMinutes}
                onChange={(e) => setFormData({ ...formData, gracePeriodMinutes: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="maxDeduction">Max Deduction Per Day (₱)</Label>
            <Input
              id="maxDeduction"
              type="number"
              value={formData.maxDeductionPerDay}
              onChange={(e) => setFormData({ ...formData, maxDeductionPerDay: parseFloat(e.target.value) || 0 })}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe how this policy works..."
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
      </ConfirmationModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPolicyToDelete(null);
        }}
        onConfirm={confirmDeletePolicy}
        title="Delete Policy"
        message="Are you sure you want to delete this policy? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}

export default function DeductionPoliciesPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <DeductionPoliciesContent />
    </ProtectedRoute>
  );
}
