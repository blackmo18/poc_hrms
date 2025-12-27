"use client";

import React, { useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import MultiSelect from "@/components/form/MultiSelect";

interface UserFormData {
  employee_id: string;
  email: string;
  organization_id: string;
  role_ids: string[];
}

interface ValidationError {
  [key: string]: string;
}

interface EditUserFormProps {
  formData: UserFormData;
  errors: ValidationError;
  organizations: Array<{ id: string; name: string }>;
  roleOptions: Array<{ value: string; text: string }>;
  selectedEmployeeName: string;
  onChange: (field: keyof UserFormData, value: any) => void;
  onEmployeeSelect: () => void;
  loading: boolean;
  employeeDetails?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    custom_id?: string;
  };
}

export default function EditUserForm({
  formData,
  errors,
  organizations,
  roleOptions,
  selectedEmployeeName,
  onChange,
  onEmployeeSelect,
  loading,
  employeeDetails,
}: EditUserFormProps) {
  return (
    <form className='space-y-6 mb-7'>
      <div className='grid grid-cols-1 gap-6'>
        {/* Organization - Read Only */}
        <div>
          <Label>Organization *</Label>
          <Input
            value={Array.isArray(organizations) ? organizations.find(org => org.id === formData.organization_id)?.name || 'Unknown' : 'Unknown'}
            readOnly
            className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800"
          />
          {errors.organization_id && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.organization_id}
            </p>
          )}
        </div>

        {/* Email - Read Only */}
        <div>
          <Label htmlFor="email">Login Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            placeholder="Employee email will be used for login"
            error={!!errors.email}
            readOnly
            className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Email is auto-populated from employee record
          </p>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          )}
        </div>
        {/* Employee Details - Read Only */}
        <div>
          <Label>Employee *</Label>
          <div className="space-y-2">
            <Input
              value={selectedEmployeeName || 'Unknown'}
              placeholder="Employee name"
              readOnly
              className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800"
            />
            <Input
              value={employeeDetails?.custom_id || employeeDetails?.id || 'Unknown'}
              placeholder="Employee ID"
              readOnly
              className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800"
            />
          </div>
          {errors.employee_id && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.employee_id}
            </p>
          )}
        </div>

        {/* Roles - Editable */}
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
