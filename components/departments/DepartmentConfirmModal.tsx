import Button from '../ui/button/Button';
import { Modal } from '../ui/modal';

interface Organization {
  id: number;
  name: string;
}

interface DepartmentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  departmentData: {
    organizationId: string;
    name: string;
    description: string;
  };
  organizations: Organization[];
  isSaving: boolean;
}

export default function DepartmentConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  departmentData,
  organizations,
  isSaving,
}: DepartmentConfirmModalProps) {
  const getOrganizationName = (id: string) => {
    const org = organizations.find(o => o.id === Number(id));
    return org?.name || 'Unknown';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[500px] m-4"
    >
      <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Confirm Department Creation
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Please review the department details before creating. Are you sure you want to proceed?
          </p>
        </div>
        <div className="flex flex-col">
          <div className="px-2 pb-3">
            <div>
              <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                Department Details:
              </h5>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Organization:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {getOrganizationName(departmentData.organizationId)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Department Name:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {departmentData.name}
                  </span>
                </div>
                {departmentData.description && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Description:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[200px]">
                      {departmentData.description}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button
              variant="outline"
              size="md"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={onConfirm}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? 'Creating...' : 'Confirm Create'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
