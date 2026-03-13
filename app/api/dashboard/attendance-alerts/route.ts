import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/session-validator';
import { getTimeEntryService, getEmployeeService, getDepartmentService } from '@/lib/service';

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session = await validateSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.userId;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // Get services
    const timeEntryService = getTimeEntryService();
    const employeeService = getEmployeeService();
    const departmentService = getDepartmentService();

    // Fetch data
    const [todayTimeEntries, allEmployees, allDepartments] = await Promise.all([
      timeEntryService.getByEmployeeAndDateRange(userId, todayStart, todayEnd),
      employeeService.getAll(),
      departmentService.getAll(session, {})
    ]);

    // Create maps for lookups
    const employeeMap = new Map(allEmployees.data.map(emp => [emp.id, {
      name: `${emp.firstName} ${emp.lastName}`,
      departmentId: emp.departmentId
    }]));
    
    const departmentMap = new Map(allDepartments.data.map(dept => [dept.id, dept.name]));

    const alerts: any[] = [];

    // Check for late arrivals
    todayTimeEntries.forEach(entry => {
      const clockInTime = new Date(entry.clockInAt);
      const employee = employeeMap.get(entry.employeeId);
      
      if (employee) {
        // Late arrival (after 8:30 AM)
        if (clockInTime.getHours() > 8 || (clockInTime.getHours() === 8 && clockInTime.getMinutes() > 30)) {
          alerts.push({
            id: `${entry.id}-late`,
            type: 'late_arrival',
            employee: employee.name,
            department: departmentMap.get(employee.departmentId) || 'Unknown',
            time: clockInTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }),
            severity: clockInTime.getHours() > 9 ? 'high' : 'medium'
          });
        }

        // Early departure (before 5:00 PM)
        if (entry.clockOutAt) {
          const clockOutTime = new Date(entry.clockOutAt);
          if (clockOutTime.getHours() < 17 || (clockOutTime.getHours() === 17 && clockOutTime.getMinutes() < 30)) {
            alerts.push({
              id: `${entry.id}-early`,
              type: 'early_departure',
              employee: employee.name,
              department: departmentMap.get(employee.departmentId) || 'Unknown',
              time: clockOutTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              }),
              severity: 'medium'
            });
          }

          // Excessive overtime (more than 2 hours)
          const totalMinutes = entry.totalWorkMinutes || 0;
          if (totalMinutes > 10 * 60) { // More than 10 hours
            alerts.push({
              id: `${entry.id}-overtime`,
              type: 'excessive_overtime',
              employee: employee.name,
              department: departmentMap.get(employee.departmentId) || 'Unknown',
              time: clockOutTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              }),
              severity: totalMinutes > 12 * 60 ? 'high' : 'medium'
            });
          }
        }
      }
    });

    // Sort by severity and time
    const sortedAlerts = alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      // If same severity, sort by time (most recent first)
      return new Date(`1970-01-01 ${b.time}`).getTime() - new Date(`1970-01-01 ${a.time}`).getTime();
    }).slice(0, 10); // Get top 10 alerts

    return NextResponse.json(sortedAlerts);
  } catch (error) {
    console.error('Error fetching attendance alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance alerts' },
      { status: 500 }
    );
  }
}
