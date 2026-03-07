'use client';

import { useSidebar } from '../../context/SidebarContext';
import { MenuIcon, CloseIcon } from '../../icons';

const FloatingSidebarToggle = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  return (
    <button
      onClick={toggleMobileSidebar}
      className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition-all duration-300 ease-out hover:bg-brand-600 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-brand-500/20 md:hidden dark:bg-brand-600 dark:hover:bg-brand-700 transform hover:scale-110 active:scale-95 ${
        isMobileOpen ? 'rotate-90' : 'rotate-0'
      }`}
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
