'use client';

import { useState, useEffect } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgeColor } from '@/components/ui/badge/Badge';
import Badge from '@/components/ui/badge/Badge';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import { PlusIcon, EditIcon, TrashIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from 'lucide-react';
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

interface PayrollPeriod {
  id: string;
  name: string;
  type: 'MONTHLY' | 'SEMI_MONTHLY' | 'WEEKLY' | 'BI_WEEKLY';
  startDate: string;
  endDate: string;
  payDate: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  organizationId: string;
  organizationName: string;
  employeeCount: number;
  totalGrossPay: number;
  totalNetPay: number;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

function PayrollPeriodsContent() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PayrollPeriod | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'SEMI_MONTHLY' as 'MONTHLY' | 'SEMI_MONTHLY' | 'WEEKLY' | 'BI_WEEKLY',
    startDate: '',
    endDate: '',
    payDate: '',
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
    apiEndpoint: '/api/payroll-periods',
    enabled: true,
    showAllOption: false
  });

  // Mock data
  const mockPeriods: PayrollPeriod[] = [
    {
      id: '1',
      name: 'January 1-15, 2024',
      type: 'SEMI_MONTHLY',
      startDate: '2024-01-01',
      endDate: '2024-01-15',
      payDate: '2024-01-20',
      status: 'COMPLETED',
      organizationId: user?.organizationId || '1',
      organizationName: 'Tech Corp',
      employeeCount: 45,
      totalGrossPay: 2250000,
      totalNetPay: 1850000,
      processedAt: '2024-01-19T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-19T00:00:00Z',
    },
    {
      id: '2',
      name: 'January 16-31, 2024',
      type: 'SEMI_MONTHLY',
      startDate: '2024-01-16',
      endDate: '2024-01-31',
      payDate: '2024-02-05',
      status: 'PROCESSING',
      organizationId: user?.organizationId || '1',
      organizationName: 'Tech Corp',
      employeeCount: 45,
      totalGrossPay: 2300000,
      totalNetPay: 1890000,
      createdAt: '2024-01-16T00:00:00Z',
      updatedAt: '2024-01-31T00:00:00Z',
    },
    {
      id: '3',
      name: 'February 1-15, 2024',
      type: 'SEMI_MONTHLY',
      startDate: '2024-02-01',
      endDate: '2024-02-15',
      payDate: '2024-02-20',
      status: 'PENDING',
      organizationId: user?.organizationId || '1',
      organizationName: 'Tech Corp',
      employeeCount: 47,
      totalGrossPay: 0,
      totalNetPay: 0,
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z',
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPeriods(mockPeriods);
      setIsLoading(false);
    }, 1000);
  }, [selectedOrganization]);

  const handleCreatePeriod = () => {
    // TODO: Implement API call
    const newPeriod: PayrollPeriod = {
      id: Date.now().toString(),
      ...formData,
      status: 'PENDING',
      organizationId: selectedOrganization || user?.organizationId || '1',
      organizationName: 'Tech Corp',
      employeeCount: 0,
      totalGrossPay: 0,
      totalNetPay: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPeriods([...periods, newPeriod]);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleUpdatePeriod = () => {
    // TODO: Implement API call
    if (!editingPeriod) return;
    
    setPeriods(periods.map(p => 
      p.id === editingPeriod.id 
        ? { ...p, ...formData, updatedAt: new Date().toISOString() }
        : p
    ));
    setEditingPeriod(null);
    resetForm();
  };

  const handleDeletePeriod = (id: string) => {
    setPeriodToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeletePeriod = () => {
    if (periodToDelete) {
      setPeriods(periods.filter(p => p.id !== periodToDelete));
      setPeriodToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleProcessPayroll = (id: string) => {
    // TODO: Implement API call
    setPeriods(periods.map(p => 
      p.id === id 
        ? { ...p, status: 'PROCESSING', updatedAt: new Date().toISOString() }
        : p
    ));
    alert('Payroll processing started...');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'SEMI_MONTHLY',
      startDate: '',
      endDate: '',
      payDate: '',
    });
  };

  const openEditDialog = (period: PayrollPeriod) => {
    setEditingPeriod(period);
    setFormData({
      name: period.name,
      type: period.type,
      startDate: period.startDate,
      endDate: period.endDate,
      payDate: period.payDate,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircleIcon className="w-4 h-4" />;
      case 'PROCESSING': return <ClockIcon className="w-4 h-4 animate-spin" />;
      case 'FAILED': return <XCircleIcon className="w-4 h-4" />;
      case 'PENDING': return <ClockIcon className="w-4 h-4" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb pageTitle="Payroll Periods" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll Periods</h1>
            <p className="text-gray-600 mt-1">Manage payroll periods and track processing status</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Add Period
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

        {/* Periods List */}
        <div className="space-y-4">
          {periods.map((period) => (
            <Card key={period.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{period.name}</h3>
                      <Badge color={
                        period.status === 'COMPLETED' ? 'success' : 
                        period.status === 'PROCESSING' ? 'info' : 
                        period.status === 'FAILED' ? 'error' : 'warning'
                      }>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(period.status)}
                          {period.status}
                        </div>
                      </Badge>
                      <Badge color="light">{period.type}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500">Period</p>
                          <p className="font-medium">
                            {formatDate(period.startDate)} - {formatDate(period.endDate)}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Pay Date</p>
                        <p className="font-medium">{formatDate(period.payDate)}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Employees</p>
                        <p className="font-medium">{period.employeeCount}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Gross Pay</p>
                        <p className="font-medium">
                          {period.totalGrossPay > 0 
                            ? `₱${period.totalGrossPay.toLocaleString()}`
                            : 'N/A'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Net Pay</p>
                        <p className="font-medium">
                          {period.totalNetPay > 0 
                            ? `₱${period.totalNetPay.toLocaleString()}`
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {period.processedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Processed on {formatDate(period.processedAt)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {period.status === 'PENDING' && (
                      <Button
                        size="sm"
                        onClick={() => handleProcessPayroll(period.id)}
                      >
                        Process Payroll
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(period)}
                      disabled={period.status !== 'PENDING'}
                    >
                      <EditIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePeriod(period.id)}
                      className="text-red-600 hover:text-red-700"
                      disabled={period.status !== 'PENDING'}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {periods.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">No payroll periods found.</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                    Create your first period
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateDialogOpen || editingPeriod !== null}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingPeriod(null);
          resetForm();
        }}
        className="max-w-2xl"
      >
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingPeriod ? 'Edit Payroll Period' : 'Create New Payroll Period'}
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Period Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., January 1-15, 2024"
              />
            </div>
            
            <div>
              <Label htmlFor="type">Period Type</Label>
              <Select
                value={formData.type}
                onChange={(value: any) => setFormData({ ...formData, type: value })}
                options={[
                  { value: 'MONTHLY', label: 'Monthly' },
                  { value: 'SEMI_MONTHLY', label: 'Semi-Monthly' },
                  { value: 'WEEKLY', label: 'Weekly' },
                  { value: 'BI_WEEKLY', label: 'Bi-Weekly' },
                ]}
                placeholder="Select type"
              />
            </div>
            
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="payDate">Pay Date</Label>
              <Input
                id="payDate"
                type="date"
                value={formData.payDate}
                onChange={(e) => setFormData({ ...formData, payDate: e.target.value })}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingPeriod(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={editingPeriod ? handleUpdatePeriod : handleCreatePeriod}>
                {editingPeriod ? 'Update' : 'Create'}
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
          setPeriodToDelete(null);
        }}
        onConfirm={confirmDeletePeriod}
        title="Delete Period"
        message="Are you sure you want to delete this payroll period? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="error"
      />
    </>
  );
}

export default function PayrollPeriodsPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <PayrollPeriodsContent />
    </ProtectedRoute>
  );
}
