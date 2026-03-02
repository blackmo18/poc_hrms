'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import MetricCard from '../../components/common/MetricCard';
import { ProtectedRoute } from '../../components/protected-route';
import { DashboardRouter } from '../../components/dashboard/DashboardRouter';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Calendar,
  DollarSign,
  Building2,
  Timer,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  UserCheck,
  Moon
} from 'lucide-react';

interface TimeManagementStats {
  totalEmployees: number;
  activeToday: number;
  onTimeToday: number;
  lateToday: number;
  totalHoursToday: number;
  overtimeHoursToday: number;
  pendingCorrections: number;
  nightShiftActive: number;
  weeklyAttendance: number;
  monthlyOvertime: number;
  breakCompliance: number;
  timesheetSubmitted: number;
  timesheetPending: number;
}

interface RecentActivity {
  id: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'correction' | 'overtime';
  employee: string;
  time: string;
  status: 'normal' | 'late' | 'early' | 'overtime' | 'warning';
  description: string;
}

interface AttendanceAlert {
  id: string;
  type: 'late_arrival' | 'early_departure' | 'missing_break' | 'excessive_overtime';
  employee: string;
  department: string;
  time: string;
  severity: 'low' | 'medium' | 'high';
}

function DashboardContent() {
  const [stats, setStats] = useState<TimeManagementStats>({
    totalEmployees: 0,
    activeToday: 0,
    onTimeToday: 0,
    lateToday: 0,
    totalHoursToday: 0,
    overtimeHoursToday: 0,
    pendingCorrections: 0,
    nightShiftActive: 0,
    weeklyAttendance: 0,
    monthlyOvertime: 0,
    breakCompliance: 0,
    timesheetSubmitted: 0,
    timesheetPending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [attendanceAlerts, setAttendanceAlerts] = useState<AttendanceAlert[]>([]);

  useEffect(() => {
    const fetchTimeManagementData = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('access_token');
        
        // Mock time management data for demonstration
        const mockStats: TimeManagementStats = {
          totalEmployees: 156,
          activeToday: 142,
          onTimeToday: 128,
          lateToday: 14,
          totalHoursToday: 1124.5,
          overtimeHoursToday: 23.5,
          pendingCorrections: 8,
          nightShiftActive: 12,
          weeklyAttendance: 94.2,
          monthlyOvertime: 87.3,
          breakCompliance: 96.8,
          timesheetSubmitted: 134,
          timesheetPending: 22,
        };

        const mockActivities: RecentActivity[] = [
          {
            id: '1',
            type: 'clock_in',
            employee: 'John Doe',
            time: '08:00 AM',
            status: 'normal',
            description: 'Clocked in on time'
          },
          {
            id: '2',
            type: 'clock_in',
            employee: 'Jane Smith',
            time: '08:15 AM',
            status: 'late',
            description: 'Clocked in 15 minutes late'
          },
          {
            id: '3',
            type: 'break_start',
            employee: 'Mike Johnson',
            time: '12:30 PM',
            status: 'normal',
            description: 'Started lunch break'
          },
          {
            id: '4',
            type: 'correction',
            employee: 'Sarah Wilson',
            time: '09:45 AM',
            status: 'warning',
            description: 'Submitted time correction request'
          },
          {
            id: '5',
            type: 'clock_out',
            employee: 'Tom Brown',
            time: '06:30 PM',
            status: 'overtime',
            description: 'Clocked out with 2.5 hours overtime'
          }
        ];

        const mockAlerts: AttendanceAlert[] = [
          {
            id: '1',
            type: 'late_arrival',
            employee: 'Jane Smith',
            department: 'Engineering',
            time: '08:15 AM',
            severity: 'medium'
          },
          {
            id: '2',
            type: 'excessive_overtime',
            employee: 'Tom Brown',
            department: 'Sales',
            time: '06:30 PM',
            severity: 'high'
          },
          {
            id: '3',
            type: 'missing_break',
            employee: 'Alex Davis',
            department: 'Marketing',
            time: '02:30 PM',
            severity: 'low'
          }
        ];

        setStats(mockStats);
        setRecentActivities(mockActivities);
        setAttendanceAlerts(mockAlerts);

        // Try to fetch real data if API is available
        const response = await fetch('/api/dashboard/time-management-stats', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats || mockStats);
          setRecentActivities(data.activities || mockActivities);
          setAttendanceAlerts(data.alerts || mockAlerts);
        }
      } catch (error) {
        console.error('Failed to fetch time management data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeManagementData();
  }, []);

  const statCards = [
    {
      title: 'Active Today',
      value: `${stats.activeToday}/${stats.totalEmployees}`,
      icon: UserCheck,
      iconColor: 'text-green-600 dark:text-green-400',
      iconBgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'On Time Today',
      value: stats.onTimeToday,
      icon: CheckCircle,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Late Today',
      value: stats.lateToday,
      icon: XCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      iconBgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      title: 'Total Hours Today',
      value: `${stats.totalHoursToday.toFixed(1)}h`,
      icon: Clock,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  const secondaryStatCards = [
    {
      title: 'Overtime Today',
      value: `${stats.overtimeHoursToday.toFixed(1)}h`,
      icon: Timer,
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      title: 'Night Shift Active',
      value: stats.nightShiftActive,
      icon: Moon,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      title: 'Pending Corrections',
      value: stats.pendingCorrections,
      icon: AlertCircle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      iconBgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      title: 'Weekly Attendance',
      value: `${stats.weeklyAttendance}%`,
      icon: TrendingUp,
      iconColor: 'text-teal-600 dark:text-teal-400',
      iconBgColor: 'bg-teal-50 dark:bg-teal-900/20',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading dashboard...</div>
      </div>
    );
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'clock_in': return <Clock className="w-4 h-4" />;
      case 'clock_out': return <Clock className="w-4 h-4" />;
      case 'break_start': return <Timer className="w-4 h-4" />;
      case 'break_end': return <Timer className="w-4 h-4" />;
      case 'correction': return <AlertCircle className="w-4 h-4" />;
      case 'overtime': return <TrendingUp className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: RecentActivity['status']) => {
    switch (status) {
      case 'normal': return 'text-green-600 dark:text-green-400';
      case 'late': return 'text-red-600 dark:text-red-400';
      case 'early': return 'text-blue-600 dark:text-blue-400';
      case 'overtime': return 'text-orange-600 dark:text-orange-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getAlertSeverityColor = (severity: AttendanceAlert['severity']) => {
    switch (severity) {
      case 'high': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2 dark:text-gray-300">Management overview of all employee time tracking</p>
      </div>

      {/* Primary Time Management Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {secondaryStatCards.map((card) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Time Activities
            </CardTitle>
            <span className="text-sm text-gray-500 dark:text-gray-400">Last 24 hours</span>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getStatusColor(activity.status)} bg-opacity-10`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{activity.employee}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getStatusColor(activity.status)}`}>{activity.time}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{activity.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Attendance Alerts
            </CardTitle>
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {attendanceAlerts.length}
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendanceAlerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${getAlertSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-sm">{alert.employee}</p>
                    <span className="text-xs opacity-75">{alert.time}</span>
                  </div>
                  <p className="text-xs opacity-90 mb-1">{alert.department}</p>
                  <p className="text-xs capitalize">{alert.type.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                <p className="text-xs font-medium">Attendance Report</p>
              </button>
              <button className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center">
                <Timer className="w-5 h-5 mx-auto mb-1 text-orange-600 dark:text-orange-400" />
                <p className="text-xs font-medium">Overtime Approval</p>
              </button>
              <button className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center">
                <AlertCircle className="w-5 h-5 mx-auto mb-1 text-yellow-600 dark:text-yellow-400" />
                <p className="text-xs font-medium">Time Corrections</p>
              </button>
              <button className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center">
                <Calendar className="w-5 h-5 mx-auto mb-1 text-green-600 dark:text-green-400" />
                <p className="text-xs font-medium">Leave Management</p>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analytics & Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center">
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
                <p className="text-xs font-medium">Productivity Report</p>
              </button>
              <button className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center">
                <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-600 dark:text-green-400" />
                <p className="text-xs font-medium">Payroll Summary</p>
              </button>
              <button className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center">
                <Moon className="w-5 h-5 mx-auto mb-1 text-indigo-600 dark:text-indigo-400" />
                <p className="text-xs font-medium">Night Shift Report</p>
              </button>
              <button className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center">
                <Activity className="w-5 h-5 mx-auto mb-1 text-teal-600 dark:text-teal-400" />
                <p className="text-xs font-medium">Compliance Report</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card className="mt-6 border-l-4 border-l-yellow-500">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            Pending Approvals
          </CardTitle>
          <span className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs px-2 py-1 rounded-full">
            {stats.pendingCorrections + stats.timesheetPending} items
          </span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Time Corrections</span>
                <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-1 rounded-full">
                  {stats.pendingCorrections}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Awaiting manager approval</p>
              <button className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">Review Now →</button>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Timesheets</span>
                <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-full">
                  {stats.timesheetPending}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Pending submission review</p>
              <button className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">Review Now →</button>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Leave Requests</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
                  3
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Awaiting approval</p>
              <button className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">Review Now →</button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardRouter>
        <DashboardContent />
      </DashboardRouter>
    </ProtectedRoute>
  );
}
