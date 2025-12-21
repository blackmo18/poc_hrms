import Button from '../ui/button/Button';
import { Modal } from '../ui/modal';

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

interface EmployeeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employeeData: {
    organization_id: string;
    department_id: string;
    job_title_id: string;
    manager_id: string;
    first_name: string;
    last_name: string;
    work_email: string; // Now the primary email field
    work_contact?: string;
    personal_address: string;
    personal_contact_number: string;
    personal_email?: string; // Now optional
    date_of_birth: string;
    gender: string;
    employment_status: string;
    hire_date: string;
  };
  organizations: Organization[];
  departments: Department[];
  jobTitles: JobTitle[];
  managers: Employee[];
  isSaving: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  showDetails?: boolean;
}

export default function EmployeeConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  employeeData,
  organizations,
  departments,
  jobTitles,
  managers,
  isSaving,
  title = "Confirm Employee Onboarding",
  description = "Please review the employee details before onboarding. Are you sure you want to proceed?",
  confirmText = "Confirm Onboard",
  cancelText = "Cancel",
  showDetails = true
}: EmployeeConfirmModalProps) {
  const getOrganizationName = (id: string) => {
    const org = organizations.find(o => o.id === Number(id));
    return org?.name || 'Unknown';
  };

  const getDepartmentName = (id: string) => {
    const dept = departments.find(d => d.id === Number(id));
    return dept?.name || 'Unknown';
  };

  const getJobTitleName = (id: string) => {
    const title = jobTitles.find(j => j.id === Number(id));
    return title?.name || 'Unknown';
  };

  const getManagerName = (id: string) => {
    if (!id) return 'No Manager';
    const manager = managers.find(m => m.id === Number(id));
    return manager ? `${manager.first_name} ${manager.last_name}` : 'Unknown';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[700px] m-4"
    >
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            {description}
          </p>
        </div>
        <div className="flex flex-col">
          {showDetails && (
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Employee Details:
                </h5>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Full Name:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {employeeData.first_name} {employeeData.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{employeeData.work_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Organization:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getOrganizationName(employeeData.organization_id)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Department:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getDepartmentName(employeeData.department_id)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Job Title:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getJobTitleName(employeeData.job_title_id)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Manager:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getManagerName(employeeData.manager_id)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Employment Status:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{employeeData.employment_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Hire Date:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(employeeData.hire_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Work Details */}
                {(employeeData.work_email || employeeData.work_contact) && (
                  <div className="mt-4">
                    <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Work Details</h6>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 space-y-2">
                      {employeeData.work_email && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Work Email:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{employeeData.work_email}</span>
                        </div>
                      )}
                      {employeeData.work_contact && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Work Contact:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{employeeData.work_contact}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Personal Details */}
                <div className="mt-4">
                  <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Personal Details</h6>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Personal Address:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{employeeData.personal_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Personal Contact:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{employeeData.personal_contact_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Personal Email:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {employeeData.personal_email || 'Not provided'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Date of Birth:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(employeeData.date_of_birth).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Gender:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{employeeData.gender}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button
              variant="outline"
              size="md"
              onClick={onClose}
            >
              {cancelText}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={onConfirm}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? 'Onboarding...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
