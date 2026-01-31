'use client';

import { usePathname } from 'next/navigation';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import AppLayout from '../layout/AppLayout';

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const pages = [
    { label: 'Clock In/Out', href: '/attendance/clock-in-out' },
    { label: 'Timesheet View', href: '/attendance/timesheet-view' },
    { label: 'Cutoff Overview', href: '/attendance/cutoff-overview' },
    { label: 'Employee Timesheets', href: '/attendance/timesheets' },
    { label: 'Time Corrections', href: '/attendance/corrections' },
    { label: 'Break Validation', href: '/attendance/breaks' },
    { label: 'Night Shift Monitor', href: '/attendance/night-shift' },
  ];

  // Get current page title based on pathname
  const getCurrentPageTitle = () => {
    const page = pages.find(p => pathname === p.href);
    return page?.label || 'Attendance';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppLayout>
        {/* Page Header with Breadcrumb */}
        <PageBreadcrumb
          pageTitle={getCurrentPageTitle()}
          breadcrumbs={[
            { label: 'Attendance', href: '/attendance' },
            { label: getCurrentPageTitle() }
          ]}
        />

        {/* Page Content */}
        {children}
      </AppLayout>
    </div>
  );
}
