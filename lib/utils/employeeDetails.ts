interface EmployeeFormData {
  organizationId: string;
  department_id: string;
  job_title_id: string;
  manager_id: string;
  custom_id: string;
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

interface Organization {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface JobTitle {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
}

export function getEmployeeGroupedDetails(
  formData: EmployeeFormData,
  organizations: Organization[],
  departments: Department[],
  jobTitles: JobTitle[],
  managers: Employee[]
) {
  // Helper functions
  const getOrganizationName = (id: string) => {
    const org = organizations.find(o => o.id.toString() === id || o.id === Number(id));
    return org?.name || 'Unknown';
  };

  const getDepartmentName = (id: string) => {
    const dept = departments.find(d => d.id.toString() === id || d.id === Number(id));
    return dept?.name || 'Unknown';
  };

  const getJobTitleName = (id: string) => {
    const job = jobTitles.find(j => j.id.toString() === id || j.id === Number(id));
    return job?.name || 'Unknown';
  };

  const getManagerName = (id: string) => {
    const mgr = managers.find(m => m.id.toString() === id || m.id === Number(id));
    return mgr ? `${mgr.first_name} ${mgr.last_name}` : 'None';
  };

  return [
    {
      name: 'Organization Details',
      fields: [
        { label: 'Organization', value: getOrganizationName(formData.organizationId) },
        { label: 'Employee ID', value: formData.custom_id || 'Not provided' },
        { label: 'Employment Status', value: formData.employment_status },
        { label: 'Hire Date', value: new Date(formData.hire_date).toLocaleDateString() },
      ]
    },
    {
      name: 'Work Details',
      fields: [
        { label: 'Department', value: getDepartmentName(formData.department_id) },
        { label: 'Job Title', value: getJobTitleName(formData.job_title_id) },
        { label: 'Manager', value: getManagerName(formData.manager_id) },
        { label: 'Work Email', value: formData.work_email },
        { label: 'Work Contact', value: formData.work_contact || 'Not provided' },
      ]
    },
    {
      name: 'Personal Details',
      fields: [
        { label: 'First Name', value: formData.first_name },
        { label: 'Last Name', value: formData.last_name },
        { label: 'Personal Address', value: formData.personal_address },
        { label: 'Personal Contact Number', value: formData.personal_contact_number },
        { label: 'Personal Email', value: formData.personal_email || 'Not provided' },
        { label: 'Date of Birth', value: new Date(formData.date_of_birth).toLocaleDateString() },
        { label: 'Gender', value: formData.gender },
      ]
    }
  ];
}
