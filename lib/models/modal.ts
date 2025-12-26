export type ModalSize = 'small' | 'default' | 'wide' | 'wider' | 'extra-wide';
export type DisplayStyle = 'separated' | 'plain';

export interface DetailItem {
  label: string;
  value: string | number | React.ReactNode;
}

export interface DetailSection {
  title?: string;
  items: DetailItem[];
}

export interface GroupedItem {
  name: string;
  fields: DetailItem[];
}

export interface DetailsConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  details?: DetailItem[];
  groupedDetails?: GroupedItem[];
  size?: ModalSize;
  displayStyle?: DisplayStyle;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}
