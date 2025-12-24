export interface EmployeeFormData {
  organization_id: string;
  department_id: string;
  job_title_id: string;
  manager_id: string;
  first_name: string;
  last_name: string;
  work_email: string;
  work_contact: string;
  personal_address: string;
  personal_contact_number: string;
  personal_email: string;
  date_of_birth: string;
  gender: string;
  employment_status: string;
  hire_date: string;
}

export const validateEmployeeForm = (formData: EmployeeFormData): string | null => {
  // Validate required fields
  if (!formData.organization_id) {
    return 'Organization is required';
  }
  if (!formData.department_id) {
    return 'Department is required';
  }
  if (!formData.job_title_id) {
    return 'Job title is required';
  }
  if (!formData.first_name.trim()) {
    return 'First name is required';
  }
  if (!formData.last_name.trim()) {
    return 'Last name is required';
  }
  if (!formData.work_email.trim()) {
    return 'Work email is required';
  }
  if (!formData.personal_address.trim()) {
    return 'Personal address is required';
  }
  if (!formData.personal_contact_number.trim()) {
    return 'Personal contact number is required';
  }
  // Personal email is now optional
  if (!formData.date_of_birth) {
    return 'Date of birth is required';
  }
  if (!formData.gender.trim()) {
    return 'Gender is required';
  }
  if (!formData.hire_date) {
    return 'Hire date is required';
  }

  return null; // No validation errors
};
