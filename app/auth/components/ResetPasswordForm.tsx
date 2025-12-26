'use client';

import { useState } from 'react';
import InputField from '@/app/components/form/input/InputField';
import Button from '@/app/components/ui/button/Button';

interface PasswordResetData {
  password: string;
  confirmPassword: string;
}

interface ValidationError {
  password?: string;
  confirmPassword?: string;
}

interface ResetPasswordFormProps {
  onSubmit: (data: PasswordResetData) => Promise<void>;
  isSubmitting: boolean;
}

export default function ResetPasswordForm({ onSubmit, isSubmitting }: ResetPasswordFormProps) {
  const [formData, setFormData] = useState<PasswordResetData>({
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<ValidationError>({});

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    Object.values(checks).forEach(check => {
      if (check) strength++;
    });

    return { strength, checks };
  };

  const validatePassword = (password: string): boolean => {
    const { checks } = getPasswordStrength(password);
    return Object.values(checks).every(check => check);
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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          New Password
        </label>
        <InputField
          id="password"
          name="password"
          type="password"
          required
          placeholder="Enter new password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={!!errors.password}
          success={formData.password && !errors.password && validatePassword(formData.password)}
        />
        {formData.password && !errors.password && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    getPasswordStrength(formData.password).strength <= 2
                      ? 'w-1/3 bg-red-500'
                      : getPasswordStrength(formData.password).strength <= 3
                      ? 'w-2/3 bg-yellow-500'
                      : 'w-full bg-green-500'
                  }`}
                />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {getPasswordStrength(formData.password).strength <= 2
                  ? 'Weak'
                  : getPasswordStrength(formData.password).strength <= 3
                  ? 'Fair'
                  : 'Strong'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center ${getPasswordStrength(formData.password).checks.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                At least 8 characters
              </div>
              <div className={`flex items-center ${getPasswordStrength(formData.password).checks.hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Uppercase letter
              </div>
              <div className={`flex items-center ${getPasswordStrength(formData.password).checks.hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Lowercase letter
              </div>
              <div className={`flex items-center ${getPasswordStrength(formData.password).checks.hasNumbers ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Number
              </div>
              <div className={`flex items-center ${getPasswordStrength(formData.password).checks.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Special character
              </div>
            </div>
          </div>
        )}
        {errors.password && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 15.586l-6.687-6.687a1 1 0 00-1.414 1.414l8.1 8.1a1 1 0 001.414 0l8.1-8.1z" clipRule="evenodd" />
            </svg>
            {errors.password}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Confirm Password
        </label>
        <InputField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          placeholder="Confirm new password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          error={!!errors.confirmPassword || (formData.confirmPassword && formData.password !== formData.confirmPassword)}
          success={formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword}
        />
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Passwords do not match
          </p>
        )}
        {errors.confirmPassword && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 15.586l-6.687-6.687a1 1 0 00-1.414 1.414l8.1 8.1a1 1 0 001.414 0l8.1-8.1z" clipRule="evenodd" />
            </svg>
            {errors.confirmPassword}
          </p>
        )}
      </div>

      <div className="pt-2">
        <Button
          variant="primary"
          size="md"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Resetting Password...
            </span>
          ) : (
            'Reset Password'
          )}
        </Button>
      </div>
    </form>
  );
}
