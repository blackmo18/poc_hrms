"use client";

import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import Input from "@/app/components/form/input/InputField";
import Button from "@/app/components/ui/button/Button";
import PaginationComponent from "@/app/components/ui/pagination/Pagination";
import { Modal } from "@/app/components/ui/modal";
import EmployeeSearchTable from "./EmployeeSearchTable";
import EmployeeSearchCard from "./EmployeeSearchCard";
import { employeeSearchReducer, initialEmployeeSearchState, EmployeeSearchState, EmployeeSearchAction } from "./employeeSearchReducer";
import { BadgeColor } from "@/app/components/ui/badge/Badge";
import { Employee, Pagination } from "@/models/employee";
import { useDebounce } from "@/app/hooks/useDebounce";

interface EmployeeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee: (employee: Employee) => void;
  organizationId: string;
  height?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'; // Tailwind height sizes
  width?: 'small' | 'default' | 'wide' | 'wider' | 'extra-wide' | 'xx-wide'; // Similar to DetailsConfirmationModal
  allowMultiple?: boolean; // Allow multiple selection
  onSelectMultiple?: (employees: Employee[]) => void; // Multiple selection callback
}

interface SearchResponse {
  data: Employee[];
  pagination: Pagination;
}

export default function EmployeeSearchModal({
  isOpen,
  onClose,
  onSelectEmployee,
  organizationId,
  height = 'lg', // Default height
  width = 'default', // Default width
  allowMultiple = false,
  onSelectMultiple,
}: EmployeeSearchModalProps) {
  const [state, dispatch] = useReducer(employeeSearchReducer, initialEmployeeSearchState);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Height mapping for Tailwind classes
  const heightClasses = {
    sm: 'h-[60vh]',
    md: 'h-[70vh]',
    lg: 'h-[85vh]',
    xl: 'h-[90vh]',
    '2xl': 'h-[95vh]',
    '3xl': 'max-h-[98vh]',
    '4xl': 'max-h-[99vh]',
    '5xl': 'max-h-[100vh]',
  };

  // Width mapping similar to DetailsConfirmationModal
  const widthClasses = {
    small: 'max-w-[350px]',
    default: 'max-w-[450px]',
    wide: 'max-w-[550px]',
    wider: 'max-w-[700px]',
    'extra-wide': 'max-w-[900px]',
    'xx-wide': 'max-w-[1200px]',
  };

  const searchEmployees = useCallback(async (query: string = "", page: number = 1) => {
    console.log('searchEmployees called with:', { query, page, organizationId });
    if (!organizationId) {
      console.log('No organizationId, returning');
      return;
    }

    dispatch({ type: 'SET_LOADING', loading: true });
    
    try {
      const params = new URLSearchParams();
      params.set("organizationId", organizationId);
      params.set("page", page.toString());
      params.set("limit", "10");
      
      // Only add search query if it's not empty
      if (query.trim()) {
        params.set("q", query.trim());
        console.log('Searching with query:', query.trim());
      } else {
        console.log('Searching all employees (empty filter)');
      }

      const url = `/api/employees/search?${params.toString()}`;
      console.log('Fetching URL:', url);

      const response = await fetch(url, {
        credentials: "include",
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result: SearchResponse = await response.json();
        console.log('Search results:', result);
        dispatch({ 
          type: 'SET_SEARCH_RESULTS', 
          employees: result.data || [], 
          pagination: result.pagination 
        });
      } else {
        console.log('Search failed');
        dispatch({ type: 'SET_SEARCH_RESULTS', employees: [], pagination: null });
      }
    } catch (error) {
      console.error("Error searching employees:", error);
      dispatch({ type: 'SET_SEARCH_RESULTS', employees: [], pagination: null });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, [organizationId]);

  // Manual debounce implementation
  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      console.log('Debounced search executing for:', query);
      searchEmployees(query, 1);
    }, 300);
  }, [searchEmployees]);

  useEffect(() => {
    // Only reset state when modal opens, don't search automatically
    if (isOpen && organizationId) {
      // Restore last search results if available and same organization
      if (state.lastSearchResults.length > 0 && state.lastSearchQuery === "") {
        dispatch({ type: 'RESTORE_LAST_SEARCH' });
      } else {
        // Reset state and search all employees for new organization
        dispatch({ type: 'RESET_STATE' });
        // Automatically search all employees when organization changes
        searchEmployees("", 1);
      }
    }
  }, [isOpen, organizationId]);

  // Also close modal if organizationId becomes empty while modal is open
  useEffect(() => {
    if (isOpen && !organizationId) {
      onClose();
    }
  }, [organizationId, isOpen, onClose]);

  // Auto-search when organization changes while modal is open
  useEffect(() => {
    if (isOpen && organizationId && state.searchQuery === "") {
      // Clear previous search results and search new organization
      dispatch({ type: 'CLEAR_LAST_SEARCH' });
      searchEmployees("", 1);
    }
  }, [organizationId]); // Only depend on organizationId

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = (value: string) => {
    console.log('handleSearch called with:', value, 'length:', value.length);
    dispatch({ type: 'SET_SEARCH_QUERY', query: value });
    
    // Trigger search for empty string (load all) or 3+ characters
    if (value.length === 0 || value.length >= 3) {
      console.log('Triggering debounced search for:', value);
      dispatch({ type: 'SET_CURRENT_PAGE', page: 1 });
      debouncedSearch(value);
    } else {
      console.log('Not searching - less than 3 characters');
    }
  };

  const handleSearchClick = () => {
    // Cancel any pending debounced search and search immediately
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    dispatch({ type: 'SET_CURRENT_PAGE', page: 1 });
    searchEmployees(state.searchQuery, 1);
  };

  const handlePageChange = (page: number) => {
    dispatch({ type: 'SET_CURRENT_PAGE', page });
    searchEmployees(state.searchQuery, page);
  };

  const handleSelectEmployee = (employee: Employee) => {
    if (allowMultiple) {
      // Toggle selection for multiple mode
      const isSelected = selectedEmployees.some(emp => emp.id === employee.id);
      if (isSelected) {
        setSelectedEmployees(selectedEmployees.filter(emp => emp.id !== employee.id));
      } else {
        setSelectedEmployees([...selectedEmployees, employee]);
      }
    } else {
      // Single selection mode
      onSelectEmployee(employee);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    if (allowMultiple && onSelectMultiple) {
      onSelectMultiple(selectedEmployees);
      onClose();
    }
  };

  const getStatusColor = (status: string): BadgeColor => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'terminated':
        return 'error';
      case 'on_leave':
        return 'info';
      default:
        return 'light';
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={`${widthClasses[width]} w-full mx-4`}>
      <div className={`p-6 flex flex-col ${heightClasses[height]}`}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Search Employees
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Find and select an employee to assign to a user account
          </p>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Search by name, Employee ID, email... (min. 3 characters)"
                value={state.searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 h-10 pr-10"
              />
              {state.searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearch('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <Button
              variant="primary"
              onClick={() => searchEmployees('', 1)}
              disabled={state.loading}
              className="bg-blue-600 hover:bg-blue-700 text-white h-10"
            >
              Load All
            </Button>
          </div>
        </div>

        {/* Search Results - Scrollable Area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-[400px]">
          {/* Desktop Table View */}
          <div className="hidden lg:block h-full overflow-auto" onClick={(e) => e.stopPropagation()}>
            {state.employees.length === 0 && !state.loading && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 max-w-md mx-auto">
                  <div className="text-gray-500 dark:text-gray-400">
                    <p className="text-lg font-medium mb-2">No employees loaded</p>
                    <p className="text-sm">Click "Load All" to see all employees or use the search to find specific ones</p>
                  </div>
                </div>
              </div>
            )}
            {state.employees.length > 0 && (
              <EmployeeSearchTable
                employees={state.employees}
                getStatusColor={getStatusColor}
                onSelectEmployee={handleSelectEmployee}
                loading={state.loading}
                currentPage={state.currentPage}
                limit={10}
              />
            )}
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden h-full overflow-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            {state.loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : state.employees.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 max-w-md mx-auto">
                  <div className="text-gray-500 dark:text-gray-400">
                    <p className="text-lg font-medium mb-2">No employees loaded</p>
                    <p className="text-sm">Click "Load All" to see all employees or use the search to find specific ones</p>
                  </div>
                </div>
              </div>
            ) : (
              state.employees.map((employee, index) => (
                <EmployeeSearchCard
                  key={employee.id}
                  employee={employee}
                  index={index}
                  getStatusColor={getStatusColor}
                  onSelectEmployee={handleSelectEmployee}
                />
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {state.pagination && (
          <div className="mt-6">
            <PaginationComponent
              pagination={state.pagination}
              currentPage={state.currentPage}
              onPageChange={handlePageChange}
              itemName="employees"
            />
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          {allowMultiple && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
            </div>
          )}
          <div className="flex gap-2">
            {allowMultiple && selectedEmployees.length > 0 && onSelectMultiple && (
              <Button
                variant="primary"
                onClick={handleConfirmSelection}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Confirm Selection ({selectedEmployees.length})
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
