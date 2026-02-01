import { Button } from '@/components/ui/button';

interface PayrollSummaryButtonProps {
  onGenerateSummary: () => Promise<void>;
  isGenerating: boolean;
  disabled: boolean;
}

export function PayrollSummaryButton({
  onGenerateSummary,
  isGenerating,
  disabled,
}: PayrollSummaryButtonProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h3 className="font-medium text-sm mb-2">Payroll Summary</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Generate a summary to preview payroll data before processing.
      </p>
      <Button
        onClick={onGenerateSummary}
        disabled={isGenerating || disabled}
        variant="outline"
        className="w-full"
      >
        {isGenerating ? 'Generating Summary...' : 'Generate Summary'}
      </Button>
    </div>
  );
}
