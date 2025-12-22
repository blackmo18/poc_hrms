'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { PlusIcon, Building2Icon } from '@/app/icons';
import ComponentCard from '@/app/components/common/ComponentCard';
import PageMeta from '@/app/components/common/PageMeta';
import PageBreadcrumb from '@/app/components/common/PageBreadCrumb';
import Pagination from '@/app/components/ui/pagination';
import ConfirmationModal from '@/app/components/ui/modal/ConfirmationModal';
import ErrorModal from '@/app/components/ui/modal/ErrorModal';
import Badge, { BadgeColor } from '@/app/components/ui/badge/Badge';
import DepartmentTable from '@/app/components/departments/DepartmentTable';
import DepartmentCardList from '@/app/components/departments/DepartmentCardList';

interface Department {
  id: string;
  name: string;
  description?: string;
  organization: {
    id: string;
    name: string;
  };
  employees: Array<{
    id: string;
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [departmentToDelete, setDepartmentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

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

  const handleDeleteClick = useCallback((departmentId: string, departmentName: string) => {
    setDepartmentToDelete({ id: departmentId, name: departmentName });
    setDeleteSuccess(false);
    setShowDeleteModal(true);
  }, []);

  const toggleCardExpansion = useCallback((departmentId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedCards(newExpanded);
  }, [expandedCards]);

  const getStatusColor = (status: string): BadgeColor => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'warning';
      case 'SUSPENDED':
        return 'error';
      default:
        return 'info';
    }
  };

  // Memoize the empty state component to prevent unnecessary re-renders
  const emptyStateComponent = useMemo(() => (
    departments.length === 0 && (
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
    )
  ), [departments.length]);

  const handleConfirmDelete = async () => {
    if (!departmentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/departments/${departmentToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setDeleteSuccess(true);
        // Refresh the list after a short delay to show success state
        setTimeout(() => {
          setShowDeleteModal(false);
          setDepartmentToDelete(null);
          setDeleteSuccess(false);
          fetchDepartments(currentPage);
        }, 1500);
      } else {
        const errorData = await response.json();
        setShowDeleteModal(false);
        setErrorMessage(errorData.error || 'Failed to delete department');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      setShowDeleteModal(false);
      setErrorMessage('An error occurred while deleting the department');
      setShowErrorModal(true);
    } finally {
      setIsDeleting(false);
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
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Department
            </Link>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="relative">
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10 rounded-xl">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Loading departments...</span>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Table View */}
          <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
            <DepartmentTable departments={departments} onDelete={handleDeleteClick} page={currentPage} limit={10} />
          </div>

          {/* Mobile Card View */}
          <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
            <DepartmentCardList 
              departments={departments} 
              onDelete={handleDeleteClick}
              expandedCards={expandedCards}
              onToggle={toggleCardExpansion}
              getStatusColor={getStatusColor}
            />
          </div>

          {/* Empty State */}
          {!loading && emptyStateComponent}
        </ComponentCard>
      </div>

      {/* Pagination */}
      <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
        <Pagination
          pagination={pagination}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemName="departments"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        size='wider'
        isOpen={showDeleteModal}
        onClose={() => {
          if (!deleteSuccess) {
            setShowDeleteModal(false);
            setDepartmentToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title={deleteSuccess ? "Deleted Successfully" : "Delete Department"}
        message={deleteSuccess 
          ? `The department "${departmentToDelete?.name}" has been deleted successfully.`
          : `Are you sure you want to delete the department "${departmentToDelete?.name}"? This action cannot be undone.`
        }
        variant={deleteSuccess ? "success" : "warning"}
        confirmText={deleteSuccess ? "Done" : "Delete"}
        cancelText="Cancel"
        isLoading={isDeleting}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errorMessage={errorMessage}
      />
    </div>
  );
}
