import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PencilIcon, TrashBinIcon, BriefcaseIcon } from '@/icons';

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

interface JobTitleCardListProps {
  jobTitles: JobTitle[];
  onDelete: (jobTitleId: number, jobTitleName: string) => void;
}

export default function JobTitleCardList({ jobTitles, onDelete }: JobTitleCardListProps) {
  return (
    <div className="lg:hidden space-y-4">
      {jobTitles.map((jobTitle) => (
        <Card key={jobTitle.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">{jobTitle.name}</CardTitle>
              </div>
              <div className="flex space-x-2">
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Organization</p>
                <p className="font-medium">{jobTitle.organization.name}</p>
              </div>
              {jobTitle.description && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                  <p className="text-sm">{jobTitle.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
                <p className="font-medium">{jobTitle.employees.length} employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
