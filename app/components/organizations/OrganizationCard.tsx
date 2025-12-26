import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ChevronUpIcon } from '../../icons';
import Badge, { BadgeColor } from '../../components/ui/badge/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/card';

interface Organization {
  id: number;
  name: string;
  email?: string;
  contact_number?: string;
  website?: string;
  address?: string;
  logo?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface OrganizationCardProps {
  org: Organization;
  isExpanded: boolean;
  onToggle: (orgId: number) => void;
  getStatusColor: (status: string) => BadgeColor;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({
  org,
  isExpanded,
  onToggle,
  getStatusColor
}) => {
  return (
    <Card className="mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader
        className="pb-3 cursor-pointer relative"
        onClick={() => onToggle(org.id)}
      >
        <div className="grid grid-cols-[1fr,auto] gap-4 items-start pr-6">
          <div className="flex items-start space-x-4 min-w-0">
            {/* Logo */}
            <div className="flex-shrink-0 mt-1">
              {org.logo ? (
                <img
                  src={org.logo}
                  alt={`${org.name} logo`}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    {org.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Name, Status, Website, Contact - stacked vertically */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{org.name}</h3>
              </div>

              <div>
                <div className="mt-1">
                  <Badge size="sm" color={getStatusColor(org.status)}>
                    {org.status}
                  </Badge>
                </div>
              </div>

              {org.website && (
                <div>
                  <p className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-1">
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {org.website.replace(/^https?:\/\//, '')}
                    </a>
                  </p>
                </div>
              )}

              {org.contact_number && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {org.contact_number}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Arrow Icon - absolutely positioned */}
          <div className="absolute top-3 right-3 flex items-center">
            {isExpanded ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-3">
            {org.address && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Address
                </span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{org.address}</p>
              </div>
            )}

            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Created
              </span>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {new Date(org.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Updated
              </span>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {new Date(org.updated_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <Link
                href={`/organizations/details/${org.id}`}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Edit
              </Link>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default OrganizationCard;
