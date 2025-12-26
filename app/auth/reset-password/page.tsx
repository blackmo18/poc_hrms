'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageMeta from '@/app/components/common/PageMeta';
import PageBreadcrumb from '@/app/components/common/PageBreadCrumb';
import Button from '@/app/components/ui/button/Button';
import ErrorModal from '@/app/components/ui/modal/ErrorModal';

interface User {
  id: string;
  name: string;
  email: string;
}

interface PasswordResetData {
  password: string;
  confirmPassword: string;
}

interface ValidationError {
  password?: string;
  confirmPassword?: string;
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState<PasswordResetData>({
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<ValidationError>({});

  useEffect(() => {
    if (!token) {
      setErrorMessage('Invalid reset link. Please request a new password reset.');
      setShowErrorModal(true);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch('/api/password-reset/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || 'Invalid or expired reset link.');
        setShowErrorModal(true);
        return;
      }

      // Get user details
      const userResponse = await fetch(`/api/users/${result.user_id}`);
      const userData = await userResponse.json();

      setUser({
        id: userData.id,
        name: userData.name || userData.email,
        email: userData.email,
      });
    } catch (error) {
      setErrorMessage('Failed to validate reset link. Please try again.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string): boolean => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationError = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PasswordResetData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/password-reset/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          new_password: formData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || 'Failed to reset password. Please try again.');
        setShowErrorModal(true);
        return;
      }

      // Password reset successful, redirect to login
      router.push('/auth/login?message=Password reset successful. Please login with your new password.');
    } catch (error) {
      setErrorMessage('An error occurred while resetting your password. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Invalid Reset Link
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The password reset link is invalid or has expired.
          </p>
          <Link href="/auth/forgot-password">
            <Button variant="primary" size="md">
              Request New Reset Link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title='Reset Password - HR Management System' description='Reset your account password' />
      <PageBreadcrumb
        pageTitle='Reset Password'
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Auth', href: '/auth' },
          { label: 'Reset Password' },
        ]}
      />

      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Reset Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              for {user.name} ({user.email})
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Button
                variant="primary"
                size="md"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        errorMessage={errorMessage}
      />
    </>
  );
}
