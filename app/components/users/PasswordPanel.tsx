'use client';

import React, { useState } from 'react';
import PasswordGenerator from './PasswordGenerator';
import Button from '@/app/components/ui/button/Button';
import { Copy, Check } from 'lucide-react';

interface PasswordPanelProps {
  password: string;
  onPasswordChange: (password: string) => void;
  onGeneratePassword: (e?: React.MouseEvent) => void;
  resetLink: string;
  resetLinkLabel?: string;
  resetLinkDescription?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  showPasswordSection?: boolean;
  showLinkSection?: boolean;
}

export default function PasswordPanel({
  password,
  onPasswordChange,
  onGeneratePassword,
  resetLink,
  resetLinkLabel = 'Password Reset Link',
  resetLinkDescription = 'Share this link with the user to set their password',
  disabled = false,
  loading = false,
  error = '',
  showPasswordSection = true,
  showLinkSection = true,
}: PasswordPanelProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resetLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className='space-y-6 mb-7'>
      <div>
        <h3 className='text-lg font-semibold text-gray-800 dark:text-white/90 mb-2'>
          Password Management
        </h3>
        <p className='text-sm text-gray-500 dark:text-gray-400'>
          Generate password and create reset link for the user
        </p>
      </div>

      {showPasswordSection && (
          <PasswordGenerator
            value={password}
            onChange={onPasswordChange}
            onGenerate={onGeneratePassword}
            disabled={disabled || loading}
            error={!!error}
            errorMessage={error}
          />
      )}

      {showLinkSection && (
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              {resetLinkLabel}
            </label>
            {loading ? (
              <div className='flex gap-2'>
                <div className='flex-1 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg'>
                  <div className='animate-pulse'>
                    <div className='h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2'></div>
                    <div className='h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2'></div>
                  </div>
                </div>
                <Button
                  variant='outline'
                  size='md'
                  disabled={loading}
                  className='whitespace-nowrap'
                >
                  <div className='animate-pulse w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded'></div>
                </Button>
              </div>
            ) : resetLink ? (
              <div className='flex gap-2'>
                <div className='flex-1 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg'>
                  <p className='text-sm text-gray-900 dark:text-white break-all font-mono'>
                    {resetLink}
                  </p>
                </div>
                <Button
                  variant='outline'
                  size='md'
                  onClick={handleCopyLink}
                  className='whitespace-nowrap'
                >
                  {linkCopied ? (
                    <>
                      <Check className='w-4 h-4 mr-2' />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className='w-4 h-4 mr-2' />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className='flex gap-2'>
                <div className='flex-1 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg'>
                  <p className='text-sm text-gray-500 dark:text-gray-400 text-center'>
                    Password reset link will appear here after user creation
                  </p>
                </div>
                <Button
                  variant='outline'
                  size='md'
                  disabled
                  className='whitespace-nowrap'
                >
                  <Copy className='w-4 h-4 mr-2' />
                  Copy
                </Button>
              </div>
            )}
            <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
              {resetLinkDescription}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
