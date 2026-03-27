'use client';

import { useSidebar } from '../../context/SidebarContext';
import { MenuIcon, CloseIcon } from '../../icons';

const FloatingSidebarToggle = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  return (
    <button
      onClick={toggleMobileSidebar}
      className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg ring-1 ring-inset transition-all duration-300 ease-out hover:shadow-xl focus:outline-none focus:ring-4 transform hover:scale-110 active:scale-95 md:hidden ${
        isMobileOpen 
          ? 'bg-brand-500 text-white ring-brand-500 hover:bg-brand-600 focus:ring-brand-500/20 dark:bg-brand-600 dark:hover:bg-brand-700 dark:focus:ring-brand-600/20' 
          : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50 focus:ring-gray-500/20 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 dark:focus:ring-gray-600/20'
      } ${isMobileOpen ? 'rotate-90' : 'rotate-0'}`}
      aria-label={isMobileOpen ? "Close sidebar" : "Open sidebar"}
    >
      <div className={`transition-all duration-300 ease-in-out transform ${
        isMobileOpen ? 'scale-90' : 'rotate-0 scale-100'
      }`}>
        {isMobileOpen ? (
          <CloseIcon className="h-6 w-6" />
        ) : (
          <MenuIcon className="h-6 w-6" />
        )}
      </div>
    </button>
  );
};

export default FloatingSidebarToggle;
