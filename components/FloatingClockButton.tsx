'use client';

import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { EmployeeTimeStats } from '@/types/employee-dashboard';
import FloatingActionButton from './ui/FloatingActionButton';
import { useSidebar } from '@/context/SidebarContext';

interface FloatingClockButtonProps {
  status: EmployeeTimeStats['todayStatus'];
}

export default function FloatingClockButton({ status }: FloatingClockButtonProps) {
  const router = useRouter();
  const { isMobileOpen } = useSidebar();

  const handleClick = () => {
    router.push('/attendance/clock-in-out');
  };

  // Only show when sidebar is active on mobile
  if (!isMobileOpen) {
    return null;
  }

  return (
    <FloatingActionButton
      onClick={handleClick}
      isActive={false}
      position="fixed bottom-24 right-6"
      ariaLabel="Clock In/Out"
    >
      <Clock className="h-6 w-6" />
    </FloatingActionButton>
  );
}
