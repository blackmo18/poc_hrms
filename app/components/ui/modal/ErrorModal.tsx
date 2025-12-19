import Button from '../button/Button';
import { Modal } from './index';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  errorMessage: string;
}

export default function ErrorModal({
  isOpen,
  onClose,
  title = 'Error',
  errorMessage,
}: ErrorModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[400px] m-4"
    >
      <div className="no-scrollbar relative w-full max-w-[400px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
        <div className="px-2 pr-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              {title}
            </h4>
          </div>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            {errorMessage}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-2">
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
