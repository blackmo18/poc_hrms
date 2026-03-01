import Button from '../button/Button';
import { Modal } from './index';
import { 
  ModalSize, 
  DisplayStyle, 
  DetailItem, 
  DetailSection, 
  GroupedItem, 
  DetailsConfirmationModalProps 
} from '@/lib/models/modal';

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
  details: defaultDetails,
  groupedDetails: grouped,
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
    if (grouped && grouped.length > 0) {
      return grouped.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-4 last:mb-0">
          <h6 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-2">
            {group.name}
          </h6>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            {group.fields.map((item, itemIndex) => renderDetailItem(item, itemIndex))}
          </div>
        </div>
      ));
    }

    if (defaultDetails && defaultDetails.length > 0) {
      return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          {defaultDetails.map((item, index) => renderDetailItem(item, index))}
        </div>
      );
    }

    return null;
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

        <div className="px-2 mb-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          {renderDetails()}
        </div>

        <div className="flex items-center justify-end gap-3 px-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          {cancelText && (
            <Button
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
          )}
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
