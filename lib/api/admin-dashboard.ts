import { TimeManagementStats, RecentActivity, AttendanceAlert } from '@/types/admin-dashboard';

const API_BASE = '/api/dashboard';

class AdminDashboardAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  }

  async getStats(): Promise<TimeManagementStats> {
    try {
      const response = await fetch(`${API_BASE}/time-management-stats`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch time management stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching time management stats:', error);
      throw error;
    }
  }

  async getRecentActivities(): Promise<RecentActivity[]> {
    try {
      const response = await fetch(`${API_BASE}/recent-activities`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recent activities: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  async getAttendanceAlerts(): Promise<AttendanceAlert[]> {
    try {
      const response = await fetch(`${API_BASE}/attendance-alerts`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch attendance alerts: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching attendance alerts:', error);
      throw error;
    }
  }

  // Method to fetch all dashboard data at once
  async getAllDashboardData() {
    try {
      const [stats, recentActivities, attendanceAlerts] = await Promise.all([
        this.getStats(),
        this.getRecentActivities(),
        this.getAttendanceAlerts()
      ]);

      return {
        stats,
        recentActivities,
        attendanceAlerts
      };
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      throw error;
    }
  }
}

export const adminDashboardAPI = new AdminDashboardAPI();
