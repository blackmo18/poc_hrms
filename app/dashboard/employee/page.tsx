'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import MetricCard from '../../../components/common/MetricCard';
import { ProtectedRoute } from '../../../components/protected-route';
import { DashboardRouter } from '../../../components/dashboard/DashboardRouter';
import { 
  Clock, 
  Calendar,
  Timer,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Coffee,
  Home,
  FileText,
  Users
} from 'lucide-react';

interface EmployeeTimeStats {
  todayHours: number;
  weekHours: number;
  monthHours: number;
  overtimeHours: number;
  remainingLeave: number;
  pendingRequests: number;
  todayStatus: 'not_clocked_in' | 'clocked_in' | 'on_break' | 'clocked_out';
  clockInTime?: string;
  breakTime?: string;
  lastClockOut?: string;
}

interface RecentActivity {
  id: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  date: string;
  time: string;
  description: string;
}

interface LeaveRequest {
  id: string;
  type: 'annual' | 'sick' | 'personal';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  days: number;
}

interface OvertimeRequest {
  id: string;
  date: string;
  hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

function EmployeeDashboardContent() {
  const [stats, setStats] = useState<EmployeeTimeStats>({
    todayHours: 0,
    weekHours: 32.5,
    monthHours: 145.2,
    overtimeHours: 8.5,
    remainingLeave: 12,
    pendingRequests: 2,
    todayStatus: 'clocked_in',
    clockInTime: '08:00 AM',
    breakTime: '12:30 PM',
    lastClockOut: ''
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        // Mock employee data for demonstration
        const mockStats: EmployeeTimeStats = {
          todayHours: 4.5,
          weekHours: 32.5,
          monthHours: 145.2,
          overtimeHours: 8.5,
          remainingLeave: 12,
          pendingRequests: 2,
          todayStatus: 'clocked_in',
          clockInTime: '08:00 AM',
          breakTime: '12:30 PM',
          lastClockOut: ''
        };

        const mockActivities: RecentActivity[] = [
          {
            id: '1',
            type: 'clock_in',
            date: 'Today',
            time: '08:00 AM',
            description: 'Clocked in for regular shift'
          },
          {
            id: '2',
            type: 'break_start',
            date: 'Today',
            time: '12:30 PM',
            description: 'Started lunch break'
          },
          {
            id: '3',
            type: 'break_end',
            date: 'Today',
            time: '01:30 PM',
            description: 'Ended lunch break'
          },
          {
            id: '4',
            type: 'clock_out',
            date: 'Yesterday',
            time: '06:15 PM',
            description: 'Clocked out with 15 min overtime'
          },
          {
            id: '5',
            type: 'clock_in',
            date: 'Yesterday',
            time: '08:00 AM',
            description: 'Clocked in on time'
          }
        ];

        const mockLeaveRequests: LeaveRequest[] = [
          {
            id: '1',
            type: 'annual',
            startDate: '2024-02-15',
            endDate: '2024-02-16',
            status: 'approved',
            days: 2
          },
          {
            id: '2',
            type: 'sick',
            startDate: '2024-02-20',
            endDate: '2024-02-21',
            status: 'pending',
            days: 2
          }
        ];

        const mockOvertimeRequests: OvertimeRequest[] = [
          {
            id: '1',
            date: '2024-02-10',
            hours: 2.5,
            reason: 'Project deadline completion',
            status: 'approved'
          },
          {
            id: '2',
            date: '2024-02-08',
            hours: 1.5,
            reason: 'Client meeting preparation',
            status: 'pending'
          }
        ];

        setStats(mockStats);
        setRecentActivities(mockActivities);
        setLeaveRequests(mockLeaveRequests);
        setOvertimeRequests(mockOvertimeRequests);

        // Try to fetch real data if API is available
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/dashboard/employee-stats', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats || mockStats);
          setRecentActivities(data.activities || mockActivities);
          setLeaveRequests(data.leaveRequests || mockLeaveRequests);
          setOvertimeRequests(data.overtimeRequests || mockOvertimeRequests);
        }
      } catch (error) {
        console.error('Failed to fetch employee data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  const statCards = [
    {
      title: 'Today\'s Hours',
      value: `${stats.todayHours.toFixed(1)}h`,
      icon: Clock,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'This Week',
      value: `${stats.weekHours.toFixed(1)}h`,
      icon: Calendar,
      iconColor: 'text-green-600 dark:text-green-400',
      iconBgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'This Month',
      value: `${stats.monthHours.toFixed(1)}h`,
      icon: TrendingUp,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Overtime',
      value: `${stats.overtimeHours.toFixed(1)}h`,
      icon: Timer,
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  const getStatusColor = (status: EmployeeTimeStats['todayStatus']) => {
    switch (status) {
      case 'clocked_in': return 'text-green-600 dark:text-green-400';
      case 'on_break': return 'text-yellow-600 dark:text-yellow-400';
      case 'clocked_out': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-red-600 dark:text-red-400';
    }
  };

  const getStatusText = (status: EmployeeTimeStats['todayStatus']) => {
    switch (status) {
      case 'clocked_in': return 'Clocked In';
      case 'on_break': return 'On Break';
      case 'clocked_out': return 'Clocked Out';
      default: return 'Not Clocked In';
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'clock_in': return <Clock className="w-4 h-4" />;
      case 'clock_out': return <Home className="w-4 h-4" />;
      case 'break_start': return <Coffee className="w-4 h-4" />;
      case 'break_end': return <Coffee className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      case 'rejected': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
        <p className="text-gray-600 mt-2 dark:text-gray-300 text-sm sm:text-base">Track your time, leave, and overtime</p>
      </div>

      {/* Current Status Card - Mobile Optimized */}
      <Card className="mb-6 border-l-4 border-l-blue-500">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`p-2 sm:p-3 rounded-full ${getStatusColor(stats.todayStatus)} bg-opacity-10`}>
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  <span className="block sm:inline">Current Status:</span>
                  <span className={`block sm:inline ml-0 sm:ml-2 ${getStatusColor(stats.todayStatus)}`}>{getStatusText(stats.todayStatus)}</span>
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1">
                  {stats.clockInTime && `Clocked in at ${stats.clockInTime}`}
                  {stats.breakTime && <span className="block sm:inline sm:ml-2">• Break at {stats.breakTime}</span>}
                </p>
              </div>
            </div>
            <div className="text-right sm:text-left">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.todayHours.toFixed(1)}h</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Today's hours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Stats - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
        {statCards.map((card) => (
          <MetricCard
            id={card.title}
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            iconColor={card.iconColor}
            iconBgColor={card.iconBgColor}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activities - Mobile Optimized */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5" />
              Recent Time Activities
            </CardTitle>
            <span className="text-sm text-gray-500 dark:text-gray-400">Last 7 days</span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{activity.date}</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{activity.description}</p>
                    </div>
                  </div>
                  <div className="text-right sm:text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.time}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{activity.type.replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leave & Overtime Summary - Mobile Optimized */}
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5" />
                Leave Balance
              </CardTitle>
              <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full">
                {stats.remainingLeave} days
              </span>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {leaveRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white capitalize truncate">{request.type} leave</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{request.days} days</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${getRequestStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                View all leave requests →
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Timer className="w-5 h-5" />
                Overtime
              </CardTitle>
              <span className="bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-xs px-2 py-1 rounded-full">
                {stats.pendingRequests} pending
              </span>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {overtimeRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{request.hours}h</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{request.date}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${getRequestStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                View all overtime →
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions - Mobile Optimized */}
      <Card className="mt-4 sm:mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <button className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center active:scale-95">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <p className="text-xs sm:text-sm font-medium">Clock In/Out</p>
            </button>
            <button className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center active:scale-95">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
              <p className="text-xs sm:text-sm font-medium">Request Leave</p>
            </button>
            <button className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center active:scale-95">
              <Timer className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
              <p className="text-xs sm:text-sm font-medium">Request OT</p>
            </button>
            <button className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center active:scale-95">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
              <p className="text-xs sm:text-sm font-medium">Timesheet</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmployeeDashboard() {
  return (
    <ProtectedRoute>
      <DashboardRouter>
        <EmployeeDashboardContent />
      </DashboardRouter>
    </ProtectedRoute>
  );
}
