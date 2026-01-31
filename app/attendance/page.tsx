'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function AttendancePage() {
  useEffect(() => {
    redirect('/attendance/cutoff-overview');
  }, []);

  return null;
}
