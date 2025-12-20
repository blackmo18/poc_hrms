import Link from 'next/link';
import { memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { PencilIcon, TrashBinIcon } from '@/app/icons';

interface JobTitle {
  id: number;
  name: string;
  description?: string;
  organization: {
    id: number;
    name: string;
  };
  employees: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
}

interface JobTitleTableBodyProps {
  jobTitles: JobTitle[];
  onDelete: (jobTitleId: number, jobTitleName: string) => void;
}

const JobTitleTableBody = memo(function JobTitleTableBody({ jobTitles, onDelete }: JobTitleTableBodyProps) {
  return (
    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
      {jobTitles.map((jobTitle) => (
        <TableRow key={jobTitle.id}>
          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {jobTitle.id}
          </TableCell>
          <TableCell className="px-4 py-3 text-start">
            <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {jobTitle.name}
            </span>
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {jobTitle.description || 'No description'}
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {jobTitle.organization.name}
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {jobTitle.employees.length}
          </TableCell>
          <TableCell className="px-4 py-3 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Link
                href={`/job-titles/${jobTitle.id}/edit`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
              </Link>
              <button
                onClick={() => onDelete(jobTitle.id, jobTitle.name)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800 dark:hover:text-red-300 transition-colors"
              >
                <TrashBinIcon className="w-4 h-4" />
              </button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
});

interface JobTitleTableProps {
  jobTitles: JobTitle[];
  onDelete: (jobTitleId: number, jobTitleName: string) => void;
}

export default function JobTitleTable({ jobTitles, onDelete }: JobTitleTableProps) {
  return (
    <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="w-full overflow-x-auto">
        <Table>
          {/* Table Header - Static, doesn't re-render */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                ID
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Name
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Description
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Organization
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Employees
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body - Only re-renders when data changes */}
          <JobTitleTableBody jobTitles={jobTitles} onDelete={onDelete} />
        </Table>
      </div>
    </div>
  );
}
