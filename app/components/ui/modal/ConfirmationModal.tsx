import Button from '../button/Button';
import { Modal } from './index';

type ConfirmationVariant = 'error' | 'warning' | 'info' | 'success';
type ModalSize = 'small' | 'default' | 'wide' | 'wider' | 'extra-wide';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: ConfirmationVariant;
  size?: ModalSize;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  small: 'max-w-[350px]',
  default: 'max-w-[400px]',
  wide: 'max-w-[550px]',
  wider: 'max-w-[700px]',
  'extra-wide': 'max-w-[900px]',
};

const variantStyles: Record<ConfirmationVariant, {
  iconBg: string;
  iconColor: string;
  confirmBg: string;
}> = {
  error: {
    iconBg: 'bg-red-100 dark:bg-red-900/20',
    iconColor: 'text-red-600 dark:text-red-400',
    confirmBg: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
  },
  info: {
    iconBg: 'bg-blue-100 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    confirmBg: 'bg-blue-600 hover:bg-blue-700',
  },
  success: {
    iconBg: 'bg-green-100 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
    confirmBg: 'bg-brand-500 hover:bg-brand-600',
  },
};

const VariantIcon = ({ variant }: { variant: ConfirmationVariant }) => {
  switch (variant) {
    case 'error':
      return (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      );
    case 'warning':
      return (
        <svg
          className="h-6 w-6"
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
      );
    case 'info':
      return (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'success':
      return (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
  }
};

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'info',
  size = 'default',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
}: ConfirmationModalProps) {
  const styles = variantStyles[variant];
  const modalSizeClass = sizeClasses[size];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={`${modalSizeClass} m-4`}
    >
      <div className={`no-scrollbar relative w-full ${modalSizeClass} overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8`}>
        <div className="px-2 pr-14">
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex h-12 w-12 aspect-square items-center justify-center rounded-full ${styles.iconBg}`}>
              <span className={styles.iconColor}>
                <VariantIcon variant={variant} />
              </span>
            </div>
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              {title}
            </h4>
          </div>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-2">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            disabled={isLoading}
            className={`${styles.confirmBg} text-white`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
