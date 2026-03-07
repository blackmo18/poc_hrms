import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/session-validator';
import { getTimeEntryService, timeBreakService } from '@/lib/service';

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
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    
    const timeEntries = await timeEntryService.getByEmployeeAndDateRange(userId, sevenDaysAgo, today);

    // Convert time entries to activities with breaks
    const activitiesWithBreaks = await Promise.all(
      timeEntries
        .sort((a, b) => new Date(b.clockInAt).getTime() - new Date(a.clockInAt).getTime())
        .slice(0, 10) // Get last 10 time entries
        .map(async (entry: any) => {
          const clockInTime = new Date(entry.clockInAt);
          const clockOutTime = entry.clockOutAt ? new Date(entry.clockOutAt) : null;
          
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
            type: 'clock_in' as const,
            date: clockInTime.toISOString(),
            time: clockInTime.toISOString(),
            description: 'Clocked in for regular shift'
          }];

          // Add break activities
          breaks.forEach((breakItem: any) => {
            const breakStartTime = new Date(breakItem.breakStartAt);
            activities.push({
              id: `${breakItem.id}-break-start`,
              type: 'break_start' as const,
              date: breakStartTime.toISOString(),
              time: breakStartTime.toISOString(),
              description: `Started ${breakItem.breakType?.toLowerCase() || 'lunch'} break`
            });

            // Add break end activity if break is completed
            if (breakItem.breakEndAt) {
              const breakEndTime = new Date(breakItem.breakEndAt);
              activities.push({
                id: `${breakItem.id}-break-end`,
                type: 'break_end' as const,
                date: breakEndTime.toISOString(),
                time: breakEndTime.toISOString(),
                description: `Ended ${breakItem.breakType?.toLowerCase() || 'lunch'} break`
              });
            }
          });

          // Add clock out activity if available and entry is closed
          if (clockOutTime && entry.status === 'CLOSED') {
            const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
            const overtimeHours = Math.max(0, hoursWorked - 8);
            
            activities.push({
              id: `${entry.id}-clock-out`,
              type: 'clock_out' as const,
              date: clockOutTime.toISOString(),
              time: clockOutTime.toISOString(),
              description: overtimeHours > 0 
                ? `Clocked out with ${overtimeHours.toFixed(1)}h overtime` 
                : 'Clocked out'
            });
          }

          return activities;
        })
    );

    // Flatten all activities and sort by time
    const activities = activitiesWithBreaks
      .flat()
      .sort((a, b) => {
        // Sort by ISO date string
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      })
      .slice(0, 10); // Limit to 10 most recent activities

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching employee activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee activities' },
      { status: 500 }
    );
  }
}
