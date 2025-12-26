"use client";

import React, { useState } from "react";
import Label from "@/app/components/form/Label";
import Input from "@/app/components/form/input/InputField";
import Select from "@/app/components/form/Select";
import MultiSelect from "@/app/components/form/MultiSelect";
import Button from "@/app/components/ui/button/Button";
import ActionInput from "@/app/components/form/input/ActionInput";

interface UserFormData {
  employee_id: string;
  email: string;
  organization_id: string;
  role_ids: string[];
  generated_password?: string;
}

interface ValidationError {
  [key: string]: string;
}

interface CreateUserFormProps {
  formData: UserFormData;
  errors: ValidationError;
  organizations: Array<{ id: string; name: string }>;
  roleOptions: Array<{ value: string; text: string }>;
  selectedEmployeeName: string;
  onChange: (field: keyof UserFormData, value: any) => void;
  onEmployeeSelect: () => void;
  onGeneratePassword: (e?: React.MouseEvent) => void;
  loading: boolean;
}

export default function CreateUserForm({
  formData,
  errors,
  organizations,
  roleOptions,
  selectedEmployeeName,
  onChange,
  onEmployeeSelect,
  onGeneratePassword,
  loading,
}: CreateUserFormProps) {
  const handleGenerateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onGeneratePassword(e);
  };

  return (

      <form className='space-y-6 mb-7'>
        <div className='grid grid-cols-1 gap-6'>
          {/* Organization */}
          <div>
            <Label>Organization *</Label>
            <Select
              value={formData.organization_id}
              onChange={(value) => onChange('organization_id', value)}
              options={Array.isArray(organizations) ? organizations.map(org => ({
                value: org.id,
                label: org.name
              })) : []}
              placeholder="Select organization"
            />
            {!Array.isArray(organizations) && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Loading organizations...
              </p>
            )}
            {Array.isArray(organizations) && organizations.length === 0 && (
              <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                No organizations available
              </p>
            )}
            {errors.organization_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.organization_id}
              </p>
            )}
          </div>

          {/* Employee */}
          <div>
            <ActionInput
              label="Employee *"
              displayValue={selectedEmployeeName}
              placeholder="Click to select employee"
              disabled={!formData.organization_id}
              onClick={onEmployeeSelect}
            />
            {errors.employee_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.employee_id}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Login Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="Employee email will be used for login"
              error={!!errors.email}
              readOnly
              className="text-gray-900 dark:text-white"
            />
            {formData.employee_id && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Email is auto-populated from employee record
              </p>
            )}
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Roles */}
          <div>
            <MultiSelect
              label="Roles*"
              value={formData.role_ids}
              onChange={(values) => onChange('role_ids', values)}
              options={roleOptions}
              placeholder="Select roles"
            />
            {errors.role_ids && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.role_ids}
              </p>
            )}
          </div>
        </div>
      </form>

  );
}
