export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  custom_id: string;
  job_title: string; // Required for backward compatibility
  employment_status?: string;
  hire_date?: string;
  organization?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  jobTitle?: {
    id: string;
    name: string;
  };
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface EmployeeSearchResponse {
  data: Employee[];
  pagination: Pagination;
}
