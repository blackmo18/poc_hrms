import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  onGeneratePayroll: () => Promise<void>;
  onBatchGeneratePayroll?: () => Promise<void>;
  isGenerating: boolean;
  disabled: boolean;
  eligibleCount?: number;
}

export function ActionButtons({
  onGeneratePayroll,
  onBatchGeneratePayroll,
  isGenerating,
  disabled,
  eligibleCount = 0,
}: ActionButtonsProps) {
  return (
    <div className="flex gap-3 pt-4">
      <Button
        onClick={onGeneratePayroll}
        disabled={isGenerating || disabled}
        className="flex-1"
      >
        {isGenerating ? 'Generating...' : 'Generate Payroll'}
      </Button>
      {onBatchGeneratePayroll && (
        <Button
          onClick={onBatchGeneratePayroll}
          disabled={isGenerating || disabled || eligibleCount === 0}
          variant="outline"
          className="flex-1"
        >
          Batch Generate ({eligibleCount})
        </Button>
      )}
      <Button variant="outline" className="flex-1">
        Preview
      </Button>
    </div>
  );
}
