'use client';

import { useState, useEffect, useReducer } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageMeta from '@/components/common/PageMeta';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Button from '@/components/ui/button/Button';
import ErrorModal from '@/components/ui/modal/ErrorModal';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import ResetPasswordForm from '@/app/auth/components/ResetPasswordForm';
import { useTheme } from '@/context/ThemeContext';
import InitialLoadingScreen from '@/components/common/InitialLoadingScreen';

interface User {
  id: string;
  name: string;
  email: string;
}

interface PasswordResetData {
  password: string;
  confirmPassword: string;
}

interface PasswordResetState {
  // Data states
  user: User | null;

  // Loading states
  loading: boolean;
  initialLoading: boolean;
  submitting: boolean;

  // UI states
  showErrorModal: boolean;
  showSuccessModal: boolean;
  errorMessage: string;
}

type PasswordResetAction =
  // Data actions
  | { type: 'SET_USER'; payload: User | null }

  // Loading actions
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIAL_LOADING'; payload: boolean }
  | { type: 'SET_SUBMITTING'; payload: boolean }

  // UI actions
  | { type: 'SET_SHOW_ERROR_MODAL'; payload: boolean }
  | { type: 'SET_SHOW_SUCCESS_MODAL'; payload: boolean }
  | { type: 'SET_ERROR_MESSAGE'; payload: string }

  // Combined actions
  | { type: 'START_LOADING' }
  | { type: 'FINISH_LOADING' };

function passwordResetReducer(state: PasswordResetState, action: PasswordResetAction): PasswordResetState {
  switch (action.type) {
    // Data actions
    case 'SET_USER':
      return { ...state, user: action.payload };

    // Loading actions
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_INITIAL_LOADING':
      return { ...state, initialLoading: action.payload };
    case 'SET_SUBMITTING':
      return { ...state, submitting: action.payload };

    // UI actions
    case 'SET_SHOW_ERROR_MODAL':
      return { ...state, showErrorModal: action.payload };
    case 'SET_SHOW_SUCCESS_MODAL':
      return { ...state, showSuccessModal: action.payload };
    case 'SET_ERROR_MESSAGE':
      return { ...state, errorMessage: action.payload };

    // Combined actions
    case 'START_LOADING':
      return { ...state, loading: true, showErrorModal: false, errorMessage: '' };
    case 'FINISH_LOADING':
      return { ...state, loading: false, initialLoading: false };

    default:
      return state;
  }
}

const initialPasswordResetState: PasswordResetState = {
  // Data states
  user: null,

  // Loading states
  loading: true,
  initialLoading: true,
  submitting: false,

  // UI states
  showErrorModal: false,
  showSuccessModal: false,
  errorMessage: '',
};

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { toggleTheme } = useTheme();
  const [state, dispatch] = useReducer(passwordResetReducer, initialPasswordResetState);

  useEffect(() => {
    if (!token) {
      dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'Invalid reset link. Please request a new password reset.' });
      dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      dispatch({ type: 'START_LOADING' });

      const response = await fetch('/api/password-reset/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok) {
        dispatch({ type: 'SET_ERROR_MESSAGE', payload: result.error || 'Invalid or expired reset link.' });
        dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
        return;
      }

      // Get user details
      const userResponse = await fetch(`/api/users/${result.user_id}`);
      const userData = await userResponse.json();

      dispatch({ type: 'SET_USER', payload: {
        id: userData.id,
        name: userData.name || userData.email,
        email: userData.email,
      }});
    } catch (error) {
      dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'Failed to validate reset link. Please try again.' });
      dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
    } finally {
      dispatch({ type: 'FINISH_LOADING' });
    }
  };

  const handleFormSubmit = async (formData: PasswordResetData) => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });

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
        dispatch({ type: 'SET_ERROR_MESSAGE', payload: result.error || 'Failed to reset password. Please try again.' });
        dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
        return;
      }

      // Password reset successful, show success modal
      dispatch({ type: 'SET_SHOW_SUCCESS_MODAL', payload: true });
    } catch (error) {
      dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'An error occurred while resetting your password. Please try again.' });
      dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };

  if (state.initialLoading) {
    return (
      <InitialLoadingScreen
        title="Reset Password"
        subtitle="Reset your password"
        loadingText="Loading..."
      />
    );
  }

  if (!state.user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.03] shadow-lg">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Invalid Reset Link
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link href="/auth/forgot-password">
                <Button variant="primary" size="md" className="w-full">
                  Request New Reset Link
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <PageMeta title='Reset Password - HR Management System' description='Reset your account password' />
      
      <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
        <button
          onClick={toggleTheme}
          className="inline-flex items-center justify-center text-white transition-colors rounded-full size-14 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <svg
            className="hidden dark:block"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.99998 1.5415C10.4142 1.5415 10.75 1.87729 10.75 2.2915V3.5415C10.75 3.95572 10.4142 4.2915 9.99998 4.2915C9.58577 4.2915 9.24998 3.95572 9.24998 3.5415V2.2915C9.24998 1.87729 9.58577 1.5415 9.99998 1.5415ZM10.0009 6.79327C8.22978 6.79327 6.79402 8.22904 6.79402 10.0001C6.79402 11.7712 8.22978 13.207 10.0009 13.207C11.772 13.207 13.2078 11.7712 13.2078 10.0001C13.2078 8.22904 11.772 6.79327 10.0009 6.79327ZM5.29402 10.0001C5.29402 7.40061 7.40135 5.29327 10.0009 5.29327C12.6004 5.29327 14.7078 7.40061 14.7078 10.0001C14.7078 12.5997 12.6004 14.707 10.0009 14.707C7.40135 14.707 5.29402 12.5997 5.29402 10.0001ZM15.9813 5.08035C16.2742 4.78746 16.2742 4.31258 15.9813 4.01969C15.6884 3.7268 15.2135 3.7268 14.9207 4.01969L14.0368 4.90357C13.7439 5.19647 13.7439 5.67134 14.0368 5.96423C14.3297 6.25713 14.8045 6.25713 15.0974 5.96423L15.9813 5.08035ZM18.4577 10.0001C18.4577 10.4143 18.1219 10.7501 17.7077 10.7501H16.4577C16.0435 10.7501 15.7077 10.4143 15.7077 10.0001C15.7077 9.58592 16.0435 9.25013 16.4577 9.25013H17.7077C18.1219 9.25013 18.4577 9.58592 18.4577 10.0001ZM14.9207 15.9806C15.2135 16.2735 15.6884 16.2735 15.9813 15.9806C16.2742 15.6877 16.2742 15.2128 15.9813 14.9199L15.0974 14.036C14.8045 13.7431 14.3297 13.7431 14.0368 14.036C13.7439 14.3289 13.7439 14.8038 14.0368 15.0967L14.9207 15.9806ZM9.99998 15.7088C10.4142 15.7088 10.75 16.0445 10.75 16.4588V17.7088C10.75 18.123 10.4142 18.4588 9.99998 18.4588C9.58577 18.4588 9.24998 18.123 9.24998 17.7088V16.4588C9.24998 16.0445 9.58577 15.7088 9.99998 15.7088ZM5.96356 15.0972C6.25646 14.8043 6.25646 14.3295 5.96356 14.0366C5.67067 13.7437 5.1958 13.7437 4.9029 14.0366L4.01902 14.9204C3.72613 15.2133 3.72613 15.6882 4.01902 15.9811C4.31191 16.274 4.78679 16.274 5.07968 15.9811L5.96356 15.0972ZM4.29224 10.0001C4.29224 10.4143 3.95645 10.7501 3.54224 10.7501H2.29224C1.87802 10.7501 1.54224 10.4143 1.54224 10.0001C1.54224 9.58592 1.87802 9.25013 2.29224 9.25013H3.54224C3.95645 9.25013 4.29224 9.58592 4.29224 10.0001ZM5.96356 4.90282C5.67067 4.60993 5.1958 4.60993 4.9029 4.90282C4.61001 5.19571 4.61001 5.67059 4.9029 5.96348L5.78678 6.84736C6.07967 7.14025 6.55455 7.14025 6.84744 6.84736C7.14033 6.55447 7.14033 6.07959 6.84744 5.7867L5.96356 4.90282Z"
              fill="currentColor"
            />
          </svg>
          <svg
            className="dark:hidden"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.4547 11.97L18.1799 12.1611C18.265 11.8383 18.1265 11.4982 17.8401 11.3266C17.5538 11.1551 17.1885 11.1934 16.944 11.4207L17.4547 11.97ZM8.0306 2.5459L8.57989 3.05657C8.80718 2.81209 8.84554 2.44682 8.67398 2.16046C8.50243 1.8741 8.16227 1.73559 7.83948 1.82066L8.0306 2.5459ZM12.9154 13.0035C9.64678 13.0035 6.99707 10.3538 6.99707 7.08524H5.49707C5.49707 11.1823 8.81835 14.5035 12.9154 14.5035V13.0035ZM16.944 11.4207C15.8869 12.4035 14.4721 13.0035 12.9154 13.0035V14.5035C14.8657 14.5035 16.6418 13.7499 17.9654 12.5193L16.944 11.4207ZM16.7295 11.7789C15.9437 14.7607 13.2277 16.9586 10.0003 16.9586V18.4586C13.9257 18.4586 17.2249 15.7853 18.1799 12.1611L16.7295 11.7789ZM10.0003 16.9586C6.15734 16.9586 3.04199 13.8433 3.04199 10.0003H1.54199C1.54199 14.6717 5.32892 18.4586 10.0003 18.4586V16.9586ZM3.04199 10.0003C3.04199 6.77289 5.23988 4.05695 8.22173 3.27114L7.83948 1.82066C4.21532 2.77574 1.54199 6.07486 1.54199 10.0003H3.04199ZM6.99707 7.08524C6.99707 5.52854 7.5971 4.11366 8.57989 3.05657L7.48132 2.03522C6.25073 3.35885 5.49707 5.13487 5.49707 7.08524H6.99707Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.03] shadow-lg">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Reset Password
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a new password for <span className="font-semibold text-gray-900 dark:text-white">{state.user.email}</span>
              </p>
            </div>

            <ResetPasswordForm 
              onSubmit={handleFormSubmit}
              isSubmitting={state.submitting}
            />

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Remember your password?{' '}
                <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Sign in instead
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={state.showSuccessModal}
        onClose={() => dispatch({ type: 'SET_SHOW_SUCCESS_MODAL', payload: false })}
        onConfirm={() => router.push('/auth/login')}
        title="Password Reset Successful"
        message="Your password has been reset successfully. Click OK to proceed to the login page."
        variant="success"
        confirmText="OK"
        cancelText="Cancel"
      />

      <ErrorModal
        isOpen={state.showErrorModal}
        onClose={() => dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: false })}
        title="Error"
        errorMessage={state.errorMessage}
      />
    </div>
  );
}
