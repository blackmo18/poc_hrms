'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import MetricCard from '../../components/common/MetricCard';
import { Users, Building2, DollarSign, Calendar } from 'lucide-react';
import { ProtectedRoute } from '../../components/protected-route';

interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  totalPayroll: number;
  pendingLeaveRequests: number;
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalDepartments: 0,
    totalPayroll: 0,
    pendingLeaveRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('access_token');
        
        // Fetch dashboard stats with authorization
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Departments',
      value: stats.totalDepartments,
      icon: Building2,
      iconColor: 'text-green-600 dark:text-green-400',
      iconBgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Total Payroll',
      value: `$${stats.totalPayroll.toLocaleString()}`,
      icon: DollarSign,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Pending Leave Requests',
      value: stats.pendingLeaveRequests,
      icon: Calendar,
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 mt-2 dark:text-gray-300">Welcome to your HR Management System</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600">No recent employees to display</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600">No recent activities to display</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
