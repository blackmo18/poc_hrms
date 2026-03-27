'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';
import LeaveTable, { LeaveRequest } from '../../components/leave/LeaveTable';
import Badge, { BadgeColor } from '../../components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import LeaveDetailsModal from '../../components/leave/LeaveDetailsModal';
import NewLeaveRequestModal from '../../components/leave/NewLeaveRequestModal';
import DetailsConfirmationModal from '@/components/ui/modal/DetailsConfirmationModal';
import { DetailItem, GroupedItem } from '@/lib/models/modal';

interface User {
  id: string;
  email: string;
  username: string;
  role?: string;
  organizationId?: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string; // Add employeeId from session
}

const statusConfig = {
  PENDING: { icon: Clock, color: 'warning' as BadgeColor, bgColor: 'bg-yellow-50' },
  APPROVED: { icon: CheckCircle, color: 'success' as BadgeColor, bgColor: 'bg-green-50' },
  REJECTED: { icon: AlertCircle, color: 'error' as BadgeColor, bgColor: 'bg-red-50' },
  CANCELLED: { icon: AlertCircle, color: 'dark' as BadgeColor, bgColor: 'bg-gray-50' },
};

interface LeaveFormData {
  leaveType: string;
  startDate: string;
  endDate: string;
  remarks: string;
}

const leaveTypeLabels: { [key: string]: string } = {
  VACATION: 'Vacation Leave',
  SICK: 'Sick Leave',
  EMERGENCY: 'Emergency Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  BEREAVEMENT: 'Bereavement Leave',
  UNPAID: 'Unpaid Leave',
};

export default function LeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<LeaveFormData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchLeaveRequests();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setCurrentUser(data.user);
          console.log('Current user fetched:', { id: data.user.id, email: data.user.email, employeeId: data.user.employeeId });
        } else {
          console.warn('No user data in session response');
          setCurrentUser(null);
        }
      } else if (response.status === 401) {
        console.warn('User not authenticated, redirecting to login...');
        // You might want to redirect to login page here
        // window.location.href = '/login';
        setCurrentUser(null);
      } else {
        console.error('Failed to fetch current user:', response.status, response.statusText);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      setCurrentUser(null);
    }
  };

  const fetchLeaveRequests = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/leave-requests');
      
      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data);
      } else if (response.status === 401) {
        console.error('Authentication failed while fetching leave requests');
        // Try to refetch user session
        await fetchCurrentUser();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch leave requests:', response.status, errorData.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleNewRequest = () => {
    setShowNewRequestModal(true);
  };

  const handleSubmitRequest = async (formData: LeaveFormData) => {
    // Store the form data and show confirmation modal
    setPendingFormData(formData);
    setShowConfirmationModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData || !currentUser) return;

    setSubmitting(true);

    try {
      // Convert dates to ISO format with timezone
      const formatDateString = (dateString: string): string => {
        const date = new Date(dateString);
        // Set time to start of day (midnight) in local timezone
        date.setHours(0, 0, 0, 0);
        // Return ISO string with timezone (format: 2023-12-25T00:00:00+00:00)
        return date.toISOString();
      };

      console.log('Sending leave request with dates:', {
        startDate: formatDateString(pendingFormData.startDate),
        endDate: formatDateString(pendingFormData.endDate)
      });

      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // userId removed - backend gets it from session
          organizationId: currentUser.organizationId,
          leaveType: pendingFormData.leaveType,
          startDate: formatDateString(pendingFormData.startDate),
          endDate: formatDateString(pendingFormData.endDate),
          remarks: pendingFormData.remarks,
        }),
      });

      if (response.ok) {
        setShowConfirmationModal(false);
        setShowNewRequestModal(false);
        setPendingFormData(null);
        fetchLeaveRequests();
      } else {
        console.error('Failed to submit leave request');
      }
    } catch (error) {
      console.error('Failed to submit leave request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToEdit = () => {
    setShowConfirmationModal(false);
    // Keep the form data and return to the form modal
  };

  const getStatusColor = (status: string): BadgeColor => {
    return statusConfig[status as keyof typeof statusConfig]?.color || 'light';
  };

  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const getLeaveStats = () => {
    // Count all requests regardless of date
    const totalRequests = leaveRequests.length;
    const pendingRequests = leaveRequests.filter(req => req.status === 'PENDING').length;
    const approvedRequests = leaveRequests.filter(req => req.status === 'APPROVED').length;
    const rejectedRequests = leaveRequests.filter(req => req.status === 'REJECTED').length;
    
    const totalDaysUsed = leaveRequests
      .filter(req => req.status === 'APPROVED')
      .reduce((total, req) => {
        return total + calculateDays(req.startDate, req.endDate);
      }, 0);

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalDaysUsed,
    };
  };

  const getConfirmationDetails = (): GroupedItem[] => {
    if (!pendingFormData) return [];

    const duration = calculateDays(pendingFormData.startDate, pendingFormData.endDate);
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    };

    return [
      {
        name: 'Leave Details',
        fields: [
          {
            label: 'Leave Type',
            value: leaveTypeLabels[pendingFormData.leaveType] || pendingFormData.leaveType,
          },
          {
            label: 'Duration',
            value: `${duration} day${duration !== 1 ? 's' : ''}`,
          },
        ],
      },
      {
        name: 'Date Range',
        fields: [
          {
            label: 'From',
            value: formatDate(pendingFormData.startDate),
          },
          {
            label: 'To',
            value: formatDate(pendingFormData.endDate),
          },
        ],
      },
      ...(pendingFormData.remarks ? [
        {
          name: 'Remarks',
          fields: [
            {
              label: 'Notes',
              value: pendingFormData.remarks,
            },
          ],
        },
      ] : []),
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading leave requests...</div>
      </div>
    );
  }

  const stats = getLeaveStats();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Leave Requests</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">File and track your leave requests</p>
        </div>
        <Button onClick={handleNewRequest} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>File New Leave</span>
        </Button>
      </div>

      {/* Leave Statistics */}
      <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4 lg:gap-4 lg:mb-8">
        <Card className="lg:rounded-xl">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-blue-600 mr-2 lg:h-8 lg:w-8 lg:mr-3" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 lg:text-sm">Total</p>
                <p className="text-lg font-bold lg:text-2xl text-gray-900 dark:text-white">{stats.totalRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:rounded-xl">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-yellow-600 mr-2 lg:h-8 lg:w-8 lg:mr-3" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 lg:text-sm">Pending</p>
                <p className="text-lg font-bold lg:text-2xl text-gray-900 dark:text-white">{stats.pendingRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:rounded-xl">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2 lg:h-8 lg:w-8 lg:mr-3" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 lg:text-sm">Approved</p>
                <p className="text-lg font-bold lg:text-2xl text-gray-900 dark:text-white">{stats.approvedRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:rounded-xl">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-600 mr-2 lg:h-8 lg:w-8 lg:mr-3" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 lg:text-sm">Rejected</p>
                <p className="text-lg font-bold lg:text-2xl text-gray-900 dark:text-white">{stats.rejectedRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Days Used - Compact on mobile */}
      <div className="grid grid-cols-1 gap-3 mb-6 lg:grid-cols-4 lg:gap-4 lg:mb-8">
        <Card className="lg:rounded-xl">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-purple-600 mr-2 lg:h-8 lg:w-8 lg:mr-3" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 lg:text-sm">Days Used</p>
                <p className="text-lg font-bold lg:text-2xl text-gray-900 dark:text-white">{stats.totalDaysUsed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Your Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaveTable
            leaveRequests={leaveRequests}
            getStatusColor={getStatusColor}
            loading={loading}
            onViewDetails={handleViewDetails}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <LeaveDetailsModal
        request={selectedRequest}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        getStatusColor={getStatusColor}
      />

      <NewLeaveRequestModal
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        onSubmit={handleSubmitRequest}
        submitting={submitting}
      />

      <DetailsConfirmationModal
        isOpen={showConfirmationModal}
        onClose={handleBackToEdit}
        onConfirm={handleConfirmSubmit}
        title="Confirm Leave Request"
        description="Please review your leave request details before submitting"
        groupedDetails={getConfirmationDetails()}
        size="wide"
        confirmText="Confirm Request"
        cancelText="Back to Edit"
        isLoading={submitting}
      />
    </div>
  );
}
