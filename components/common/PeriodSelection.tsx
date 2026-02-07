import Select from '@/components/form/Select';

interface PayrollPeriod {
  value: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

interface PeriodSelectionProps {
  selectedCutoff: string;
  onCutoffChange: (value: string) => void;
  payrollPeriods: PayrollPeriod[];
  className?: string;
}

export default function PeriodSelection({
  selectedCutoff,
  onCutoffChange,
  payrollPeriods,
  className = "mb-6"
}: PeriodSelectionProps) {
  return (
    <div className={className}>
      <label htmlFor="period-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Filter by Cutoff Period
      </label>
      <Select
        options={payrollPeriods.map(period => ({
          value: period.value,
          label: period.label
        }))}
        value={selectedCutoff}
        onChange={(value) => onCutoffChange(value)}
        placeholder="Select cutoff period"
      />
    </div>
  );
}
