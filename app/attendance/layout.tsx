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
    { label: 'Cutoff Overview', href: '/attendance/cutoff-overview' },
    { label: 'Timesheet', href: '/attendance/timesheet' },
    { label: 'Requests', href: '/attendance/requests' },
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
