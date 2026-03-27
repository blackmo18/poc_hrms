import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select';

interface PayrollPeriod {
  value: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

interface PeriodSelectionSectionProps {
  selectedCutoff: string;
  onCutoffChange: (value: string) => void;
  payrollPeriods: PayrollPeriod[];
}

export default function PeriodSelectionSection({
  selectedCutoff,
  onCutoffChange,
  payrollPeriods
}: PeriodSelectionSectionProps) {
  // Convert payroll periods to Select component format
  const selectOptions = payrollPeriods.map(period => ({
    value: period.value,
    label: period.label
  }));

  return (
    <ComponentCard title="Select Period">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Cutoff Period</label>
        <Select
          options={selectOptions}
          value={selectedCutoff}
          onChange={onCutoffChange}
          placeholder="Select cutoff period..."
          className="w-full"
        />
      </div>
    </ComponentCard>
  );
}
