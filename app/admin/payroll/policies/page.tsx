'use client';

import { useState, useEffect } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BadgeColor } from '@/components/ui/badge/Badge';
import Badge from '@/components/ui/badge/Badge';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import { PlusIcon, EditIcon, TrashIcon, ClockIcon, AlertCircleIcon } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/input/TextArea';
import Switch from '@/components/form/switch/Switch';
import OrganizationFilter from '@/components/common/OrganizationFilter';
import RoleComponentWrapper from '@/components/common/RoleComponentWrapper';
import { useAuth } from '@/components/providers/auth-provider';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import Button from '@/components/ui/button/Button';

interface DeductionPolicy {
  id: string;
  name: string;
  policyType: 'LATE' | 'UNDERTIME' | 'ABSENCE';
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
    policyType: 'LATE' as 'LATE' | 'UNDERTIME' | 'ABSENCE',
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

  // Fetch policies from API
  const fetchPolicies = async () => {
    try {
      setIsLoading(true);
      const organizationId = selectedOrganization || user?.organizationId;
      if (!organizationId) return;

      const response = await fetch(`/api/late-deduction-policy?organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch policies');
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      // Handle different response structures
      const policiesArray = Array.isArray(data) ? data : data.policies || data.data || [];
      console.log('Policies Array:', policiesArray); // Debug log
      setPolicies(policiesArray);
    } catch (error: any) {
      console.error('Error fetching policies:', error);
      // Set empty array on error
      setPolicies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [selectedOrganization]);

  const handleCreatePolicy = async () => {
    try {
      const organizationId = selectedOrganization || user?.organizationId;
      if (!organizationId) return;

      const response = await fetch('/api/late-deduction-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create policy');
      
      const newPolicy = await response.json();
      setPolicies([...policies, newPolicy]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating policy:', error);
      alert('Failed to create policy. Please try again.');
    }
  };

  const handleUpdatePolicy = async () => {
    try {
      if (!editingPolicy) return;
      
      const response = await fetch(`/api/late-deduction-policy/${editingPolicy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId: selectedOrganization || user?.organizationId,
        }),
      });

      if (!response.ok) throw new Error('Failed to update policy');
      
      const updatedPolicy = await response.json();
      setPolicies(policies.map(p => p.id === editingPolicy.id ? updatedPolicy : p));
      setIsCreateDialogOpen(false);
      setEditingPolicy(null);
      resetForm();
    } catch (error: any) {
      console.error('Error updating policy:', error);
      alert('Failed to update policy. Please try again.');
    }
  };

  const handleDeletePolicy = (id: string) => {
    setPolicyToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeletePolicy = async () => {
    try {
      if (!policyToDelete) return;
      
      const response = await fetch(`/api/late-deduction-policy/${policyToDelete}?organizationId=${selectedOrganization || user?.organizationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete policy');
      
      setPolicies(policies.filter(p => p.id !== policyToDelete));
      setShowDeleteModal(false);
      setPolicyToDelete(null);
    } catch (error: any) {
      console.error('Error deleting policy:', error);
      alert('Failed to delete policy. Please try again.');
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
      policyType: 'LATE',
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
      policyType: policy.policyType,
      deductionMethod: policy.deductionMethod,
      rate: policy.rate,
      gracePeriodMinutes: policy.gracePeriodMinutes,
      maxDeductionPerDay: policy.maxDeductionPerDay,
      description: policy.description,
      isActive: policy.isActive,
    });
    setIsCreateDialogOpen(true);
  };

  const formatRate = (method: string, rate?: number) => {
    if (rate === undefined || rate === null) {
      return 'Not set';
    }
    
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

        {/* Policies Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-gray-50 border-b">
                  <TableRow>
                    <TableCell isHeader={true} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Policy Name
                    </TableCell>
                    <TableCell isHeader={true} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </TableCell>
                    <TableCell isHeader={true} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deduction Method
                    </TableCell>
                    <TableCell isHeader={true} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </TableCell>
                    <TableCell isHeader={true} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grace Period
                    </TableCell>
                    <TableCell isHeader={true} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Max Daily Deduction
                    </TableCell>
                    <TableCell isHeader={true} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </TableCell>
                    <TableCell isHeader={true} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(policies) && policies.map((policy) => (
                    <TableRow key={policy.id} className={!policy.isActive ? 'opacity-60' : ''}>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{policy.name}</div>
                          <div className="text-sm text-gray-500">{policy.description}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <Badge color={policy.policyType === 'LATE' ? 'warning' : policy.policyType === 'UNDERTIME' ? 'error' : 'error'}>
                          {policy.policyType}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {policy.deductionMethod.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatRate(policy.deductionMethod, policy.rate)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {policy.gracePeriodMinutes} minutes
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₱{policy.maxDeductionPerDay?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        {!policy.isActive && (
                          <Badge color="dark">Inactive</Badge>
                        )}
                        {policy.isActive && (
                          <Badge color="success">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {policies.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No deduction policies found.</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                    Create your first policy
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateDialogOpen || editingPolicy !== null}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingPolicy(null);
          resetForm();
        }}
        className="max-w-2xl"
      >
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingPolicy ? 'Edit Policy' : 'Create New Policy'}
          </h2>
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
              <Label htmlFor="policyType">Policy Type</Label>
              <Select
                value={formData.policyType}
                onChange={(value: any) => setFormData({ ...formData, policyType: value })}
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
                step={0.1}
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
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Describe how this policy works..."
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              label="Active"
              defaultChecked={formData.isActive}
              onChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setEditingPolicy(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingPolicy ? handleUpdatePolicy : handleCreatePolicy}>
              {editingPolicy ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
        </div>
      </Modal>

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
        variant="error"
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
