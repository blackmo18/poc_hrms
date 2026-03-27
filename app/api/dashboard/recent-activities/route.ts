import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/session-validator';
import { getTimeEntryService, getEmployeeService, timeBreakService } from '@/lib/service';

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

    // Get time entries for the last 7 days
    const timeEntryService = getTimeEntryService();
    const employeeService = getEmployeeService();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    
    const timeEntries = await timeEntryService.getByEmployeeAndDateRange(userId, sevenDaysAgo, today);

    // Get all employees for names
    const allEmployees = await employeeService.getAll();
    const employeeMap = new Map(allEmployees.data.map(emp => [emp.id, `${emp.firstName} ${emp.lastName}`]));

    // Convert time entries to activities with breaks
    const activitiesWithBreaks = await Promise.all(
      timeEntries
        .sort((a, b) => new Date(b.clockInAt).getTime() - new Date(a.clockInAt).getTime())
        .slice(0, 10) // Get last 10 time entries
        .map(async (entry: any) => {
          const clockInTime = new Date(entry.clockInAt);
          const clockOutTime = entry.clockOutAt ? new Date(entry.clockOutAt) : null;
          const employeeName = employeeMap.get(entry.employeeId) || 'Unknown Employee';
          
          // Get breaks for this time entry
          let breaks = [];
          try {
            breaks = await timeBreakService.getByTimeEntryId(entry.id);
          } catch (error) {
            console.log('No breaks found for entry:', entry.id);
          }
          
          // Create activities for clock in
          const activities: any[] = [{
            id: `${entry.id}-clock-in`,
            type: 'clock_in',
            employee: employeeName,
            time: clockInTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }),
            status: clockInTime.getHours() > 8 || (clockInTime.getHours() === 8 && clockInTime.getMinutes() > 30) ? 'late' : 'normal',
            description: 'Regular clock in'
          }];

          // Add break activities
          breaks.forEach((breakItem: any) => {
            if (breakItem.breakStartAt) {
              activities.push({
                id: `${breakItem.id}-break-start`,
                type: 'break_start',
                employee: employeeName,
                time: new Date(breakItem.breakStartAt).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                }),
                status: 'normal',
                description: 'Break started'
              });
            }
            
            if (breakItem.breakEndAt) {
              activities.push({
                id: `${breakItem.id}-break-end`,
                type: 'break_end',
                employee: employeeName,
                time: new Date(breakItem.breakEndAt).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                }),
                status: 'normal',
                description: 'Break ended'
              });
            }
          });

          // Add clock out activity if present
          if (clockOutTime) {
            const totalMinutes = entry.totalWorkMinutes || 0;
            const isOvertime = totalMinutes > 8 * 60;
            
            activities.push({
              id: `${entry.id}-clock-out`,
              type: 'clock_out',
              employee: employeeName,
              time: clockOutTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              }),
              status: isOvertime ? 'overtime' : 'normal',
              description: isOvertime ? 'Overtime departure' : 'Regular clock out'
            });
          }

          return activities;
        })
    );

    // Flatten all activities and sort by time
    const allActivities = activitiesWithBreaks.flat().sort((a, b) => {
      const timeA = new Date(`1970-01-01 ${a.time}`);
      const timeB = new Date(`1970-01-01 ${b.time}`);
      return timeB.getTime() - timeA.getTime();
    }).slice(0, 15); // Get top 15 recent activities

    return NextResponse.json(allActivities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activities' },
      { status: 500 }
    );
  }
}
