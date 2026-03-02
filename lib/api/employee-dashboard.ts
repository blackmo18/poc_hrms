import { EmployeeTimeStats, RecentActivity, LeaveRequest, OvertimeRequest } from '@/types/employee-dashboard';

const API_BASE = '/api/dashboard';

class EmployeeDashboardAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  }

  async getStats(): Promise<EmployeeTimeStats> {
    try {
      const response = await fetch(`${API_BASE}/employee-stats`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      throw error;
    }
  }

  async getRecentActivities(): Promise<RecentActivity[]> {
    try {
      const response = await fetch(`${API_BASE}/employee-activities`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching employee activities:', error);
      throw error;
    }
  }

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    try {
      const response = await fetch(`${API_BASE}/employee-leave`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leave requests: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      throw error;
    }
  }

  async getOvertimeRequests(): Promise<OvertimeRequest[]> {
    try {
      const response = await fetch(`${API_BASE}/employee-overtime`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch overtime requests: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching overtime requests:', error);
      throw error;
    }
  }

  // Method to fetch all dashboard data at once
  async getAllDashboardData() {
    try {
      const [stats, activities, leaveRequests, overtimeRequests] = await Promise.all([
        this.getStats(),
        this.getRecentActivities(),
        this.getLeaveRequests(),
        this.getOvertimeRequests()
      ]);

      return {
        stats,
        activities,
        leaveRequests,
        overtimeRequests
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
}

export const employeeDashboardAPI = new EmployeeDashboardAPI();
