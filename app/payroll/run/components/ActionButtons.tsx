import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  onGeneratePayroll: () => Promise<void>;
  isGenerating: boolean;
  disabled: boolean;
}

export function ActionButtons({
  onGeneratePayroll,
  isGenerating,
  disabled,
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
      <Button variant="outline" className="flex-1">
        Preview
      </Button>
    </div>
  );
}
