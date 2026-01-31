'use client';

import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import TimeEntryCalendarV2 from '../form/TimeEntryCalendarV2';


interface TimeEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface TimeEntrySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTimeEntry: (timeEntry: TimeEntry) => void;
  selectedTimeEntryId?: string;
}

export default function TimeEntrySelectionModal({
  isOpen,
  onClose,
  onSelectTimeEntry,
  selectedTimeEntryId,
}: TimeEntrySelectionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl m-4"
    >
      <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
        {/* Header */}
        <div className="px-2 pr-14 mb-6">
          <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
            Select Time Entry
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a time entry from your last 30 days
          </p>
        </div>

        {/* Scrollable Content Area */}
        <div className="px-2 mb-6 max-h-[500px] overflow-y-auto custom-scrollbar">
          <TimeEntryCalendarV2
            onSelectTimeEntry={onSelectTimeEntry}
            selectedTimeEntryId={selectedTimeEntryId}
          />
        </div>

        {/* Footer with action buttons */}
        <div className="flex items-center justify-end gap-3 px-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
