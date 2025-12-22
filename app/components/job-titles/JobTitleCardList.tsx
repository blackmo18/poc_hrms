import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ChevronUpIcon, BriefcaseIcon, PencilIcon, TrashBinIcon } from '../../icons';
import Badge, { BadgeColor } from '../../components/ui/badge/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/card';

interface JobTitle {
  id: string;
  name: string;
  description?: string;
  organization: {
    id: string;
    name: string;
  };
  employees: Array<{
    id: string;
    first_name: string;
    last_name: string;
  }>;
}

interface JobTitleCardListProps {
  jobTitles: JobTitle[];
  onDelete: (jobTitleId: string, jobTitleName: string) => void;
  expandedCards?: Set<string>;
  onToggle?: (jobTitleId: string) => void;
  getStatusColor?: (status: string) => BadgeColor;
}

const JobTitleCard: React.FC<{
  jobTitle: JobTitle;
  isExpanded: boolean;
  onToggle: (jobTitleId: string) => void;
  onDelete: (jobTitleId: string, jobTitleName: string) => void;
  getStatusColor?: (status: string) => BadgeColor;
}> = ({ jobTitle, isExpanded, onToggle, onDelete, getStatusColor }) => {
  return (
    <Card className="mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader
        className="pb-3 cursor-pointer"
        onClick={() => onToggle(jobTitle.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <BriefcaseIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {jobTitle.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {jobTitle.organization.name}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                {getStatusColor && (
                  <Badge size="sm" color={getStatusColor('ACTIVE')}>
                    Active
                  </Badge>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {jobTitle.employees.length} employees
                </span>
              </div>
            </div>
          </div>
          <div className="text-gray-400">
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {jobTitle.description && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{jobTitle.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Organization</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{jobTitle.organization.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{jobTitle.employees.length} employees</p>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Link
              href={`/job-titles/${jobTitle.id}/edit`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(jobTitle.id, jobTitle.name);
              }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800 dark:hover:text-red-300 transition-colors"
            >
              <TrashBinIcon className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default function JobTitleCardList({
  jobTitles,
  onDelete,
  expandedCards = new Set(),
  onToggle,
  getStatusColor
}: JobTitleCardListProps) {
  const [localExpandedCards, setLocalExpandedCards] = useState<Set<string>>(expandedCards);

  const handleToggle = (jobTitleId: string) => {
    const newExpanded = new Set(localExpandedCards);
    if (newExpanded.has(jobTitleId)) {
      newExpanded.delete(jobTitleId);
    } else {
      newExpanded.add(jobTitleId);
    }
    setLocalExpandedCards(newExpanded);
    onToggle?.(jobTitleId);
  };

  return (
    <div className="lg:hidden space-y-4">
      {jobTitles.map((jobTitle) => (
        <JobTitleCard
          key={jobTitle.id}
          jobTitle={jobTitle}
          isExpanded={localExpandedCards.has(jobTitle.id)}
          onToggle={handleToggle}
          onDelete={onDelete}
          getStatusColor={getStatusColor}
        />
      ))}
    </div>
  );
}
