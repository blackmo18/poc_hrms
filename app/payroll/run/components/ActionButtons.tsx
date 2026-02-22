import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  onGeneratePayroll: () => Promise<void>;
  onBatchGeneratePayroll?: () => Promise<void>;
  onApprovePayroll?: () => Promise<void>;
  onReleasePayroll?: () => Promise<void>;
  onVoidPayroll?: () => Promise<void>;
  isGenerating: boolean;
  disabled: boolean;
  eligibleCount?: number;
  computedCount?: number;
  approvedCount?: number;
  releasedCount?: number;
}

export function ActionButtons({
  onGeneratePayroll,
  onBatchGeneratePayroll,
  onApprovePayroll,
  onReleasePayroll,
  onVoidPayroll,
  isGenerating,
  disabled,
  eligibleCount = 0,
  computedCount = 0,
  approvedCount = 0,
  releasedCount = 0,
}: ActionButtonsProps) {
  return (
    <div className="space-y-3">
      {/* Generation Actions */}
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
      </div>

      {/* Approval Actions */}
      {onApprovePayroll && computedCount > 0 && (
        <div className="flex gap-3">
          <Button
            onClick={onApprovePayroll}
            disabled={isGenerating || disabled}
            variant="default"
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isGenerating ? 'Approving...' : `Approve Payroll (${computedCount})`}
          </Button>
        </div>
      )}

      {/* Release Actions */}
      {onReleasePayroll && approvedCount > 0 && (
        <div className="flex gap-3">
          <Button
            onClick={onReleasePayroll}
            disabled={isGenerating || disabled}
            variant="default"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? 'Releasing...' : `Release Payroll (${approvedCount})`}
          </Button>
        </div>
      )}

      {/* Void Actions */}
      {onVoidPayroll && (approvedCount > 0 || releasedCount > 0) && (
        <div className="flex gap-3">
          <Button
            onClick={onVoidPayroll}
            disabled={isGenerating || disabled}
            variant="destructive"
            className="flex-1"
          >
            {isGenerating ? 'Voiding...' : `Void Payroll (${approvedCount + releasedCount})`}
          </Button>
        </div>
      )}

      <Button variant="outline" className="w-full">
        Preview Payslips
      </Button>
    </div>
  );
}
