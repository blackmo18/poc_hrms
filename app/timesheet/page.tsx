'use client'

import TimeClock from '@/components/TimeClock'
import PageBreadcrumb from '@/components/common/PageBreadCrumb'

export default function TimesheetPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Page Header with Breadcrumb */}
        <PageBreadcrumb
          pageTitle='Timesheet'
          breadcrumbs={[
            { label: 'Timesheet' }
          ]}
        />
        
        {/* TimeClock Component */}
        <TimeClock />
      </div>
    </div>
  )
}
