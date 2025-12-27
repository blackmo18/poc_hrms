import Button from '../ui/button/Button';
import { Modal } from '../ui/modal';

interface OrganizationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  organizationData: {
    name: string;
    email: string;
    contact_number?: string;
    website?: string;
    address?: string;
    status: string;
    description?: string;
  };
  isSaving: boolean;
}

export default function OrganizationConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  organizationData,
  isSaving,
}: OrganizationConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[700px] m-4"
    >
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Confirm Save Changes
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Please review the organization details before saving. Are you sure you want to proceed?
          </p>
        </div>
        <div className="flex flex-col">
          <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
            <div>
              <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                Organization Details:
              </h5>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{organizationData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{organizationData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Contact Number:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{organizationData.contact_number || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Website:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{organizationData.website || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{organizationData.address || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{organizationData.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Description:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{organizationData.description || 'Not provided'}</span>
                </div>
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
              {isSaving ? 'Saving...' : 'Confirm Save'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
