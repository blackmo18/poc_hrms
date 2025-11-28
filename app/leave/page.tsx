'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  remarks?: string;
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    department: {
      name: string;
    };
    jobTitle: {
      name: string;
    };
  };
}

const statusConfig = {
  PENDING: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  APPROVED: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  REJECTED: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
  CANCELLED: { icon: AlertCircle, color: 'text-gray-600', bgColor: 'bg-gray-50' },
};

export default function LeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch('/api/leave-requests');
      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      
      if (response.ok) {
        fetchLeaveRequests();
      }
    } catch (error) {
      console.error('Failed to approve leave request:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });
      
      if (response.ok) {
        fetchLeaveRequests();
      }
    } catch (error) {
      console.error('Failed to reject leave request:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading leave requests...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-gray-600 mt-2">Manage employee leave requests</p>
        </div>
        <Button className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>New Request</span>
        </Button>
      </div>

      <div className="space-y-4">
        {leaveRequests.map((request) => {
          const StatusIcon = statusConfig[request.status as keyof typeof statusConfig].icon;
          const statusColor = statusConfig[request.status as keyof typeof statusConfig].color;
          const statusBgColor = statusConfig[request.status as keyof typeof statusConfig].bgColor;

          return (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${statusBgColor}`}>
                      <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {request.employee.first_name} {request.employee.last_name}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {request.employee.jobTitle.name} • {request.employee.department.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBgColor} ${statusColor}`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Leave Type</p>
                    <p className="font-medium">{request.leave_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium">{new Date(request.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-medium">{new Date(request.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {request.remarks && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Remarks</p>
                    <p className="text-sm">{request.remarks}</p>
                  </div>
                )}

                {request.status === 'PENDING' && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleApprove(request.id)}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(request.id)}
                      className="flex items-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {leaveRequests.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests</h3>
          <p className="text-gray-600 mb-4">No leave requests found.</p>
        </div>
      )}
    </div>
  );
}
