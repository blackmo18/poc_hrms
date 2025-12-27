import React from 'react';

interface InitialLoadingScreenProps {
  title: string;
  subtitle?: string;
  loadingText?: string;
}

export default function InitialLoadingScreen({
  title,
  subtitle,
  loadingText = "Loading..."
}: InitialLoadingScreenProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-300">{loadingText}</div>
      </div>
    </div>
  );
}
