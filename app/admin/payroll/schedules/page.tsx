'use client';

import { useState, useEffect } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgeColor } from '@/components/ui/badge/Badge';
import Badge from '@/components/ui/badge/Badge';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import { PlusIcon, EditIcon, TrashIcon, ClockIcon, UsersIcon, CalendarIcon } from 'lucide-react';
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

interface WorkSchedule {
  id: string;
  name: string;
  description: string;
  schedule: {
    monday: { start: string; end: string; isEnabled: boolean };
    tuesday: { start: string; end: string; isEnabled: boolean };
    wednesday: { start: string; end: string; isEnabled: boolean };
    thursday: { start: string; end: string; isEnabled: boolean };
    friday: { start: string; end: string; isEnabled: boolean };
    saturday: { start: string; end: string; isEnabled: boolean };
    sunday: { start: string; end: string; isEnabled: boolean };
  };
  nightShiftStart: string;
  nightShiftEnd: string;
  isActive: boolean;
  organizationId: string;
  organizationName: string;
  assignedEmployees: number;
  createdAt: string;
  updatedAt: string;
}

function WorkSchedulesContent() {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    schedule: {
      monday: { start: '09:00', end: '18:00', isEnabled: true },
      tuesday: { start: '09:00', end: '18:00', isEnabled: true },
      wednesday: { start: '09:00', end: '18:00', isEnabled: true },
      thursday: { start: '09:00', end: '18:00', isEnabled: true },
      friday: { start: '09:00', end: '18:00', isEnabled: true },
      saturday: { start: '', end: '', isEnabled: false },
      sunday: { start: '', end: '', isEnabled: false },
    },
    nightShiftStart: '22:00',
    nightShiftEnd: '06:00',
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
    apiEndpoint: '/api/work-schedules',
    enabled: true,
    showAllOption: false
  });

  // Mock data
  const mockSchedules: WorkSchedule[] = [
    {
      id: '1',
      name: 'Regular Office Hours',
      description: 'Standard Monday to Friday office schedule',
      schedule: {
        monday: { start: '09:00', end: '18:00', isEnabled: true },
        tuesday: { start: '09:00', end: '18:00', isEnabled: true },
        wednesday: { start: '09:00', end: '18:00', isEnabled: true },
        thursday: { start: '09:00', end: '18:00', isEnabled: true },
        friday: { start: '09:00', end: '18:00', isEnabled: true },
        saturday: { start: '', end: '', isEnabled: false },
        sunday: { start: '', end: '', isEnabled: false },
      },
      nightShiftStart: '22:00',
      nightShiftEnd: '06:00',
      isActive: true,
      organizationId: user?.organizationId || '1',
      organizationName: 'Tech Corp',
      assignedEmployees: 45,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Night Shift Schedule',
      description: 'Graveyard shift schedule for support team',
      schedule: {
        monday: { start: '22:00', end: '06:00', isEnabled: true },
        tuesday: { start: '22:00', end: '06:00', isEnabled: true },
        wednesday: { start: '22:00', end: '06:00', isEnabled: true },
        thursday: { start: '22:00', end: '06:00', isEnabled: true },
        friday: { start: '22:00', end: '06:00', isEnabled: true },
        saturday: { start: '', end: '', isEnabled: false },
        sunday: { start: '', end: '', isEnabled: false },
      },
      nightShiftStart: '22:00',
      nightShiftEnd: '06:00',
      isActive: true,
      organizationId: user?.organizationId || '1',
      organizationName: 'Tech Corp',
      assignedEmployees: 12,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '3',
      name: 'Flexible Schedule',
      description: 'Flexible working hours with core time requirements',
      schedule: {
        monday: { start: '07:00', end: '20:00', isEnabled: true },
        tuesday: { start: '07:00', end: '20:00', isEnabled: true },
        wednesday: { start: '07:00', end: '20:00', isEnabled: true },
        thursday: { start: '07:00', end: '20:00', isEnabled: true },
        friday: { start: '07:00', end: '20:00', isEnabled: true },
        saturday: { start: '', end: '', isEnabled: false },
        sunday: { start: '', end: '', isEnabled: false },
      },
      nightShiftStart: '22:00',
      nightShiftEnd: '06:00',
      isActive: true,
      organizationId: user?.organizationId || '1',
      organizationName: 'Tech Corp',
      assignedEmployees: 8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSchedules(mockSchedules);
      setIsLoading(false);
    }, 1000);
  }, [selectedOrganization]);

  const handleCreateSchedule = () => {
    // TODO: Implement API call
    const newSchedule: WorkSchedule = {
      id: Date.now().toString(),
      ...formData,
      organizationId: selectedOrganization || user?.organizationId || '1',
      organizationName: 'Tech Corp',
      assignedEmployees: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSchedules([...schedules, newSchedule]);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleUpdateSchedule = () => {
    // TODO: Implement API call
    if (!editingSchedule) return;
    
    setSchedules(schedules.map(s => 
      s.id === editingSchedule.id 
        ? { ...s, ...formData, updatedAt: new Date().toISOString() }
        : s
    ));
    setEditingSchedule(null);
    resetForm();
  };

  const handleDeleteSchedule = (id: string) => {
    setScheduleToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteSchedule = () => {
    if (scheduleToDelete) {
      setSchedules(schedules.filter(s => s.id !== scheduleToDelete));
      setScheduleToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleToggleSchedule = (id: string) => {
    // TODO: Implement API call
    setSchedules(schedules.map(s => 
      s.id === id 
        ? { ...s, isActive: !s.isActive, updatedAt: new Date().toISOString() }
        : s
    ));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      schedule: {
        monday: { start: '09:00', end: '18:00', isEnabled: true },
        tuesday: { start: '09:00', end: '18:00', isEnabled: true },
        wednesday: { start: '09:00', end: '18:00', isEnabled: true },
        thursday: { start: '09:00', end: '18:00', isEnabled: true },
        friday: { start: '09:00', end: '18:00', isEnabled: true },
        saturday: { start: '', end: '', isEnabled: false },
        sunday: { start: '', end: '', isEnabled: false },
      },
      nightShiftStart: '22:00',
      nightShiftEnd: '06:00',
      isActive: true,
    });
  };

  const openEditDialog = (schedule: WorkSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      description: schedule.description,
      schedule: schedule.schedule,
      nightShiftStart: schedule.nightShiftStart,
      nightShiftEnd: schedule.nightShiftEnd,
      isActive: schedule.isActive,
    });
  };

  const updateDaySchedule = (day: string, field: 'start' | 'end' | 'isEnabled', value: string | boolean) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        [day]: {
          ...formData.schedule[day as keyof typeof formData.schedule],
          [field]: value,
        },
      },
    });
  };

  const getWorkDaysCount = (schedule: WorkSchedule) => {
    return Object.values(schedule.schedule).filter(day => day.isEnabled).length;
  };

  const getWorkHoursPerDay = (schedule: WorkSchedule) => {
    const enabledDays = Object.values(schedule.schedule).filter(day => day.isEnabled);
    if (enabledDays.length === 0) return 0;
    
    const firstDay = enabledDays[0];
    if (!firstDay.start || !firstDay.end) return 0;
    
    const start = new Date(`2000-01-01 ${firstDay.start}`);
    const end = new Date(`2000-01-01 ${firstDay.end}`);
    let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    // Handle overnight shifts
    if (diff < 0) diff += 24;
    
    return diff;
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
      <PageBreadcrumb pageTitle="Work Schedules" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work Schedules</h1>
            <p className="text-gray-600 mt-1">Manage work schedules and shift patterns for employees</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Add Schedule
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

        {/* Schedules List */}
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className={!schedule.isActive ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{schedule.name}</h3>
                      {!schedule.isActive && (
                        <Badge color="dark">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{schedule.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500">Work Days</p>
                          <p className="font-medium">{getWorkDaysCount(schedule)} days/week</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500">Daily Hours</p>
                          <p className="font-medium">{getWorkHoursPerDay(schedule)} hours</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500">Assigned</p>
                          <p className="font-medium">{schedule.assignedEmployees} employees</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Night Shift</p>
                        <p className="font-medium">{schedule.nightShiftStart} - {schedule.nightShiftEnd}</p>
                      </div>
                    </div>
                    
                    {/* Weekly Schedule Preview */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                      <p className="text-xs text-gray-500 mb-2">Weekly Schedule</p>
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {Object.entries(schedule.schedule).map(([day, daySchedule]) => (
                          <div
                            key={day}
                            className={`text-center p-1 rounded ${
                              daySchedule.isEnabled
                                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                            }`}
                          >
                            <p className="capitalize font-medium">{day.slice(0, 3)}</p>
                            {daySchedule.isEnabled ? (
                              <p className="text-xs mt-1">
                                {daySchedule.start}-{daySchedule.end}
                              </p>
                            ) : (
                              <p className="text-xs mt-1">Off</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      label="Active"
                      defaultChecked={schedule.isActive}
                      onChange={(checked) => handleToggleSchedule(schedule.id)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(schedule)}
                    >
                      <EditIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {schedules.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">No work schedules found.</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                    Create your first schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateDialogOpen || editingSchedule !== null}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingSchedule(null);
          resetForm();
        }}
        className="max-w-2xl"
      >
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingSchedule ? 'Edit Work Schedule' : 'Create New Work Schedule'}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Schedule Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Regular Office Hours"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
            </div>
            
            {/* Weekly Schedule */}
            <div>
              <Label>Weekly Schedule</Label>
              <div className="mt-2 space-y-2">
                {Object.entries(formData.schedule).map(([day, schedule]) => (
                  <div key={day} className="flex items-center gap-2 p-2 border rounded">
                    <Switch
                      label={day}
                      defaultChecked={schedule.isEnabled}
                      onChange={(checked) => updateDaySchedule(day, 'isEnabled', checked)}
                    />
                    <Input
                      type="time"
                      value={schedule.start}
                      onChange={(e) => updateDaySchedule(day, 'start', e.target.value)}
                      disabled={!schedule.isEnabled}
                      className="w-32"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={schedule.end}
                      onChange={(e) => updateDaySchedule(day, 'end', e.target.value)}
                      disabled={!schedule.isEnabled}
                      className="w-32"
                    />
                    {!schedule.isEnabled && (
                      <span className="text-sm text-gray-500 ml-2">Off</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Night Shift Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nightShiftStart">Night Shift Start</Label>
                <Input
                  id="nightShiftStart"
                  type="time"
                  value={formData.nightShiftStart}
                  onChange={(e) => setFormData({ ...formData, nightShiftStart: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="nightShiftEnd">Night Shift End</Label>
                <Input
                  id="nightShiftEnd"
                  type="time"
                  value={formData.nightShiftEnd}
                  onChange={(e) => setFormData({ ...formData, nightShiftEnd: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingSchedule(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}>
                {editingSchedule ? 'Update' : 'Create'}
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
          setScheduleToDelete(null);
        }}
        onConfirm={confirmDeleteSchedule}
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule? This will affect all assigned employees. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="error"
      />
    </>
  );
}

export default function WorkSchedulesPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <WorkSchedulesContent />
    </ProtectedRoute>
  );
}
