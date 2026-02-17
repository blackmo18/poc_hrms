'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
  OrganizationIcon,
  UserGroupIcon,
  BriefcaseIcon,
  LayoutGridIcon,
  CalendarInDaysIcon,
} from '../../icons';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../components/providers/auth-provider';
import { useRoleAccess } from '../../components/providers/role-access-provider';
import SidebarWidget from './SidebarWidget';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

type SubItem ={
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  roles?: string[];
}


type User = {
  id: string;
  email: string;
  username: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  organizationId?: string;
}

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
  roles?: string[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: 'Dashboard',
    path: '/dashboard'
  },
  {
    icon: <UserCircleIcon />,
    name: 'Employees',
    subItems: [
      { name: 'Employee List', path: '/employees', pro: false },
      { name: 'Onboarding', path: '/employees/onboard', pro: false },
      { name: 'Offboarding', path: '/employees/offboarding', pro: false },
    ],
    roles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
  },
  {
    icon: <CalenderIcon />,
    name: 'Leave Management',
    subItems: [
      { name: 'Leave Requests', path: '/leave', pro: false },
      { name: 'Leave Calendar', path: '/leave/calendar', pro: false },
      { name: 'Leave Approvals', path: '/leave/approvals', pro: false },
    ]
  },
  {
    name: 'Overtime',
    icon: <BriefcaseIcon />,
    subItems: [
      { name: 'OT Requests', path: '/overtime/requests', pro: false },
      { name: 'OT Approvals', path: '/overtime/approvals', pro: false, roles: ADMINSTRATIVE_ROLES },
      { name: 'OT History', path: '/overtime/history', pro: false },
    ]
  },
  {
    name: 'Payroll',
    icon: <TableIcon />,
    subItems: [
      { name: 'Payroll Run', path: '/payroll/run', pro: false, roles: ADMINSTRATIVE_ROLES },
      { name: 'Payroll Summary', path: '/payroll/summary', pro: false, roles: ADMINSTRATIVE_ROLES },
      { name: 'Payroll History', path: '/payroll/history', pro: false },
      { name: 'Payroll Rules', path: '/payroll/rules', pro: false, roles: ADMINSTRATIVE_ROLES },
      { name: 'Deduction Policies', path: '/admin/payroll/policies', pro: false, roles: ADMINSTRATIVE_ROLES },
      { name: 'Work Schedules', path: '/admin/payroll/schedules', pro: false, roles: ADMINSTRATIVE_ROLES },
      { name: 'Payroll Periods', path: '/admin/payroll/periods', pro: false, roles: ADMINSTRATIVE_ROLES },
    ]

  },
  {
    name: 'Holidays & Calendar',
    icon: <CalendarInDaysIcon />,
    subItems: [
      { name: 'Holidays', path: '/holidays', pro: false },
      { name: 'Holiday Templates', path: '/holidays/templates', pro: false },
      { name: 'Calendars', path: '/calendars', pro: false },
    ]
  },
];

const othersItems: NavItem[] = [
  {
    icon: <CalendarInDaysIcon/>,
    name: 'Attendance',
    subItems: [
      {name: 'Clock In/Out', path: '/attendance/clock-in-out'},
      {name: 'Timesheet View', path: '/attendance/timesheet-view'},
      {name: 'Cutoff Overview', path: '/attendance/cutoff-overview'},
      {name: 'Employee Timesheets', path: '/attendance/timesheets'},
      {name: 'Time Corrections', path: '/attendance/corrections'},
      {name: 'Break Validation', path: '/attendance/breaks'},
      {name: 'Night Shift Monitor', path: '/attendance/night-shift'},
    ]
  },
  {
    icon: <UserGroupIcon />,
    name: 'Accounts',
    subItems: [
      { name: 'Users', path: '/accounts/users', pro: false },
      { name: 'Roles', path: '/accounts/roles', pro: false },
      { name: 'Permissions', path: '/accounts/permissions', pro: false },
    ],
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    icon: <LayoutGridIcon />,
    name: 'Departments',
    subItems: [
      { name: 'Department List', path: '/departments', pro: false },
    ],
  },
  {
    icon: <PieChartIcon />,
    name: 'Reports',
    subItems: [
      { name: 'Analytics', path: '/reports/analytics', pro: false },
      { name: 'Attendance', path: '/reports/attendance', pro: false },
    ],
    roles: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER']
  },
  {
    icon: <BoxCubeIcon />,
    name: 'Settings',
    subItems: [
      { name: 'General', path: '/settings', pro: false },
      { name: 'User Management', path: '/settings/users', pro: false },
    ]
  },
  {
    icon: <OrganizationIcon />,
    name: 'Organizations',
    subItems: [
      { name: 'Onboarding', path: '/organizations/onboarding', pro: false },
      { name: 'Details', path: '/organizations/details', pro: false },
    ],
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const { roles, isLoading } = useRoleAccess();
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: 'main' | 'others';
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const hasAccessToItem = (itemRoles?: string[]) => {
    if (!itemRoles || itemRoles.length === 0) return true;
    if (isLoading) return false; // Don't show role-based items while roles are loading
    return itemRoles.some(role => roles.includes(role));
  };

  const filterNavItems = (items: NavItem[]) => {
    return items.map(item => ({
      ...item,
      subItems: item.subItems ? item.subItems.filter(sub => hasAccessToItem(sub.roles)) : item.subItems
    })).filter(item => hasAccessToItem(item.roles));
  };

  const filteredNavItems = filterNavItems(navItems);
  const filteredOthersItems = filterNavItems(othersItems);

  const isActive = useCallback(
    (path: string) => pathname === path,
    [pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ['main', 'others'].forEach((menuType) => {
      const items = menuType === 'main' ? filteredNavItems : filteredOthersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as 'main' | 'others',
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, filteredNavItems, filteredOthersItems, user]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: 'main' | 'others') => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: 'main' | 'others') => (
    <ul className='flex flex-col gap-4'>
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? 'menu-item-active'
                  : 'menu-item-inactive'
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? 'lg:justify-center'
                  : 'lg:justify-start'
              }`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? 'menu-item-icon-active'
                    : 'menu-item-icon-inactive'
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className='menu-item-text'>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? 'rotate-180 text-brand-500'
                      : ''
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? 'menu-item-active' : 'menu-item-inactive'
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? 'menu-item-icon-active'
                      : 'menu-item-icon-inactive'
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className='menu-item-text'>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className='overflow-hidden transition-all duration-300'
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : '0px',
              }}
            >
              <ul className='mt-2 space-y-1 ml-9'>
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? 'menu-dropdown-item-active'
                          : 'menu-dropdown-item-inactive'
                      }`}
                    >
                      {subItem.name}
                      <span className='flex items-center gap-1 ml-auto'>
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? 'menu-dropdown-badge-active'
                                : 'menu-dropdown-badge-inactive'
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? 'menu-dropdown-badge-active'
                                : 'menu-dropdown-badge-inactive'
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      key={`${isLoading}-${roles.join(',')}`}
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? 'w-[290px]'
            : isHovered
            ? 'w-[290px]'
            : 'w-[90px]'
        }
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start'
        }`}
      >
        <Link href='/'>
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className='dark:hidden'
                src='/images/logo/logo.svg'
                alt='Logo'
                width={150}
                height={40}
              />
              <img
                className='hidden dark:block'
                src='/images/logo/logo-dark.svg'
                alt='Logo'
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src='/images/logo/logo-icon.svg'
              alt='Logo'
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className='flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar'>
        <nav className='mb-6'>
          <div className='flex flex-col gap-4'>
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? 'lg:justify-center'
                    : 'justify-start'
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  'Menu'
                ) : (
                  <HorizontaLDots className='size-6' />
                )}
              </h2>
              {renderMenuItems(filteredNavItems, 'main')}
            </div>
            <div className=''>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? 'lg:justify-center'
                    : 'justify-start'
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  'Others'
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(filteredOthersItems, 'others')}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
