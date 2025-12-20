'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import Badge, { BadgeColor } from '@/app/components/ui/badge/Badge';
import { PencilIcon, PlusIcon, OrganizationIcon, UserIcon } from '@/app/icons';
import RoleComponentWrapper from '@/app/components/common/RoleComponentWrapper';
import ComponentCard from '@/app/components/common/ComponentCard';
import { useAuth } from '@/app/components/providers/auth-provider';
import PageMeta from '@/app/components/common/PageMeta';
import PageBreadcrumb from '@/app/components/common/PageBreadCrumb';
import EmployeeCard from '@/app/components/employees/EmployeeCard';
import Pagination from '@/app/components/ui/pagination';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  employment_status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE';
  hire_date: string;
  organization: {
    id: number;
    name: string;
  };
  department: {
    id: number;
    name: string;
  };
  jobTitle: {
    id: number;
    name: string;
  };
  manager?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  user?: {
    id: number;
    email: string;
  };
}

interface Organization {
  id: number;
  name: string;
}

interface ApiResponse {
  data: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function EmployeesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') || user?.role === 'SUPER_ADMIN';
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [pagination, setPagination] = useState<ApiResponse['pagination'] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchEmployees = async (orgId?: number, page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (orgId) params.set('organizationId', orgId.toString());
      params.set('page', page.toString());
      params.set('limit', '15');

      const url = `/api/employees?${params.toString()}`;
      const response = await fetch(url, {
        credentials: 'include',
      });

      if (response.status === 401) {
        setError('Unauthorized access. Please log in.');
        return;
      }

      if (response.status === 403) {
        setError('Access denied. Insufficient permissions.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const result: ApiResponse = await response.json();
      setEmployees(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setOrganizations(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    
    // For non-super admin, always filter by their organization
    if (!isSuperAdmin && user?.organization_id) {
      fetchEmployees(user.organization_id, currentPage);
    } else {
      fetchEmployees(selectedOrganization || undefined, currentPage);
    }
    
    // Only fetch organizations for super admin
    if (isSuperAdmin) {
      fetchOrganizations();
    }
  }, [selectedOrganization, currentPage, authLoading, isSuperAdmin, user?.organization_id]);

  const handleOrganizationChange = (orgId: number | null) => {
    setSelectedOrganization(orgId);
    setCurrentPage(1); // Reset to first page when changing organization filter
  };

  const getStatusColor = (status: string): BadgeColor => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'warning';
      case 'TERMINATED':
        return 'error';
      case 'ON_LEAVE':
        return 'info';
      default:
        return 'info';
    }
  };

  const toggleCardExpansion = (empId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(empId)) {
      newExpanded.delete(empId);
    } else {
      newExpanded.add(empId);
    }
    setExpandedCards(newExpanded);
  };

  // Group employees by organization for admin view
  const employeesByOrganization = useMemo(() => {
    const grouped: { [key: number]: { org: Organization; employees: Employee[] } } = {};

    employees.forEach(employee => {
      const orgId = employee.organization.id;
      if (!grouped[orgId]) {
        grouped[orgId] = {
          org: employee.organization,
          employees: []
        };
      }
      grouped[orgId].employees.push(employee);
    });

    return Object.values(grouped);
  }, [employees]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Employees
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage and view all employees in the system
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading employees...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Employees
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage and view all employees in the system
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-lg mb-2">Error</div>
            <div className="text-gray-600 dark:text-gray-300">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageMeta title='Employees - HR Management System' description='Manage employees' />
      <PageBreadcrumb
        pageTitle='Employees'
        breadcrumbs={[
          { label: 'Employees' }
        ]}
      />

      {/* Content Container */}
      <div className="w-full overflow-x-auto">
        <ComponentCard title="Employee Management" size="full">
          {/* Organization Filter - Only for Super Admin */}
          <RoleComponentWrapper roles={['SUPER_ADMIN']}>
            <div className="mb-6">
              <label htmlFor="organization-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Organization
              </label>
              <select
                id="organization-select"
                value={selectedOrganization || ''}
                onChange={(e) => handleOrganizationChange(e.target.value ? Number(e.target.value) : null)}
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Organizations</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </RoleComponentWrapper>

          {/* Add Employee Button */}
          <div className="flex justify-end mb-6">
            <Link
              href="/employees/onboard"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Onboard Employee
            </Link>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="w-full overflow-x-auto">
              <Table>
                {/* Table Header */}
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      ID
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Email
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Department
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Job Title
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Organization
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {employee.id}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {employee.first_name} {employee.last_name}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {employee.email}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {employee.department.name}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {employee.jobTitle.name}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {employee.organization.name}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge
                          size="sm"
                          color={getStatusColor(employee.employment_status)}
                        >
                          {employee.employment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <Link
                          href={`/employees/${employee.id}/edit`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {employees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                isExpanded={expandedCards.has(employee.id)}
                onToggle={toggleCardExpansion}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>

          {/* Empty State */}
          {employees.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No employees found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedOrganization
                  ? 'No employees in the selected organization.'
                  : 'Get started by onboarding your first employee.'
                }
              </p>
              <Link
                href="/employees/onboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Onboard Employee
              </Link>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        itemName="employees"
      />
    </div>
  );
}
