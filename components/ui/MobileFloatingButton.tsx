'use client';

import { ReactNode } from 'react';

export type FloatingButtonType = 'sidebar' | 'clock';

interface MobileFloatingButtonProps {
  type: FloatingButtonType;
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export default function MobileFloatingButton({ 
  type, 
  isActive, 
  onClick, 
  children, 
  className = '' 
}: MobileFloatingButtonProps) {
  // Define positions for different button types
  const positions = {
    sidebar: 'fixed bottom-6 right-6',
    clock: 'fixed bottom-24 right-6'
  };

  // Define ARIA labels for different button types
  const ariaLabels = {
    sidebar: isActive ? "Close sidebar" : "Open sidebar",
    clock: isActive ? "Clock Out" : "Clock In"
  };

  // Special rotation for sidebar toggle
  const rotationClass = type === 'sidebar' && isActive ? 'rotate-90' : '';

  return (
    <button
      onClick={onClick}
      className={`${positions[type]} z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg ring-1 ring-inset transition-all duration-300 ease-out hover:shadow-xl focus:outline-none focus:ring-4 transform hover:scale-110 active:scale-95 md:hidden ${
        isActive 
          ? 'bg-brand-500 text-white ring-brand-500 hover:bg-brand-600 focus:ring-brand-500/20 dark:bg-brand-600 dark:hover:bg-brand-700 dark:focus:ring-brand-600/20' 
          : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50 focus:ring-gray-500/20 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 dark:focus:ring-gray-600/20'
      } ${rotationClass} ${className}`}
      aria-label={ariaLabels[type]}
    >
      <div className={`transition-all duration-300 ease-in-out transform ${
        isActive ? 'scale-90' : 'rotate-0 scale-100'
      }`}>
        {children}
      </div>
    </button>
  );
}
