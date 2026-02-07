import ComponentCard from '@/components/common/ComponentCard';

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
  return (
    <ComponentCard title="Select Period">
      <div>
        <label className="block text-sm font-medium mb-2">Cutoff Period</label>
        <select
          value={selectedCutoff}
          onChange={(e) => {
            console.log(e.target.value);
            onCutoffChange(e.target.value);
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">Select cutoff period...</option>
          {payrollPeriods.map(period => (
            <option key={period.value} value={period.value}>{period.label}</option>
          ))}
        </select>
      </div>
    </ComponentCard>
  );
}
