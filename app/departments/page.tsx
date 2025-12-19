'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { PencilIcon, PlusIcon, OrganizationIcon, TrashBinIcon, Building2Icon } from '@/app/icons';
import ComponentCard from '@/app/components/common/ComponentCard';
import PageMeta from '@/app/components/common/PageMeta';
import PageBreadcrumb from '@/app/components/common/PageBreadCrumb';
import Pagination from '@/app/components/ui/pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

interface Department {
  id: number;
  name: string;
  description?: string;
  organization: {
    id: number;
    name: string;
  };
  employees: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
}

interface ApiResponse {
  data: Department[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ApiResponse['pagination'] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDepartments = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');

      const url = `/api/departments?${params.toString()}`;
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
        throw new Error('Failed to fetch departments');
      }

      const result = await response.json();
      setDepartments(result.data || []);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments(currentPage);
  }, [currentPage]);

  const handleDelete = async (departmentId: number, departmentName: string) => {
    if (!confirm(`Are you sure you want to delete the department "${departmentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Refresh the list
        fetchDepartments(currentPage);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete department: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('An error occurred while deleting the department');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Departments
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage departments in your organization
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading departments...</div>
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
              Departments
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage departments in your organization
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
      <PageMeta title='Departments - HR Management System' description='Manage departments' />
      <PageBreadcrumb
        pageTitle='Departments'
        breadcrumbs={[
          { label: 'Departments' }
        ]}
      />

      {/* Content Container */}
      <div className="w-full overflow-x-auto">
        <ComponentCard title="Department Management" size="full">
          {/* Add Department Button */}
          <div className="flex justify-end mb-6">
            <Link
              href="/departments/add"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Department
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
                      Description
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
                      Employees
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
                  {departments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {department.id}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {department.name}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {department.description || 'No description'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {department.organization.name}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {department.employees.length}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Link
                            href={`/departments/${department.id}/edit`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(department.id, department.name)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800 dark:hover:text-red-300 transition-colors"
                          >
                            <TrashBinIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {departments.map((department) => (
              <Card key={department.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <OrganizationIcon className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{department.name}</CardTitle>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/departments/${department.id}/edit`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(department.id, department.name)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800 dark:hover:text-red-300 transition-colors"
                      >
                        <TrashBinIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Organization</p>
                      <p className="font-medium">{department.organization.name}</p>
                    </div>
                    {department.description && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                        <p className="text-sm">{department.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
                      <p className="font-medium">{department.employees.length} employees</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {departments.length === 0 && (
            <div className="text-center py-12">
              <Building2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No departments found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by adding your first department.
              </p>
              <Link
                href="/departments/add"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Department
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
        itemName="departments"
      />
    </div>
  );
}
