import Button from '../button/Button';
import { Modal } from './index';

type ModalSize = 'small' | 'default' | 'wide' | 'wider' | 'extra-wide';
type DisplayStyle = 'separated' | 'plain';

interface DetailItem {
  label: string;
  value: string | number | React.ReactNode;
}

interface DetailSection {
  title?: string;
  items: DetailItem[];
}

interface DetailsConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  details: DetailItem[] | DetailSection[];
  size?: ModalSize;
  displayStyle?: DisplayStyle;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  small: 'max-w-[350px]',
  default: 'max-w-[450px]',
  wide: 'max-w-[550px]',
  wider: 'max-w-[700px]',
  'extra-wide': 'max-w-[900px]',
};

const isDetailSection = (item: DetailItem | DetailSection): item is DetailSection => {
  return 'items' in item;
};

export default function DetailsConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  details,
  size = 'default',
  displayStyle = 'separated',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
}: DetailsConfirmationModalProps) {
  const modalSizeClass = sizeClasses[size];

  const itemBorderClass = displayStyle === 'separated' 
    ? 'py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0' 
    : 'py-1.5';

  const renderDetailItem = (item: DetailItem, index: number) => (
    <div key={index} className={`flex justify-between ${itemBorderClass}`}>
      <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%]">
        {item.value}
      </span>
    </div>
  );

  const renderDetails = () => {
    if (details.length === 0) return null;

    // Check if first item is a section
    if (isDetailSection(details[0])) {
      return (details as DetailSection[]).map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-4 last:mb-0">
          {section.title && (
            <h6 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-2">
              {section.title}
            </h6>
          )}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            {section.items.map((item, itemIndex) => renderDetailItem(item, itemIndex))}
          </div>
        </div>
      ));
    }

    // Simple list of items
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        {(details as DetailItem[]).map((item, index) => renderDetailItem(item, index))}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={`${modalSizeClass} m-4`}
    >
      <div className={`no-scrollbar relative w-full ${modalSizeClass} overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8`}>
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h4>
          {description && (
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        <div className="px-2 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
          {renderDetails()}
        </div>

        <div className="flex items-center justify-end gap-3 px-2 pt-4 border-t border-gray-200 dark:border-gray-700">
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
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
