/*
  Warnings:

  - The primary key for the `accounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `accounts` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `userId` on the `accounts` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `admins` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `admins` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `organization_id` on the `admins` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `audit_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `audit_logs` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `organization_id` on the `audit_logs` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `user_id` on the `audit_logs` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `entity_id` on the `audit_logs` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `benefits` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `benefits` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `organization_id` on the `benefits` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `calendar_holidays` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `calendar_holidays` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `calendar_id` on the `calendar_holidays` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `holiday_id` on the `calendar_holidays` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `calendars` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `calendars` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `organization_id` on the `calendars` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `compensations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `compensations` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `employee_id` on the `compensations` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `deductions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `deductions` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `payroll_id` on the `deductions` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `departments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `departments` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `organization_id` on the `departments` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `documents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `documents` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `organization_id` on the `documents` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `employee_benefits` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `employee_benefits` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `employee_id` on the `employee_benefits` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `benefit_id` on the `employee_benefits` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `employee_documents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `employee_documents` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `employee_id` on the `employee_documents` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `document_id` on the `employee_documents` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `employee_holiday_assignments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `employee_holiday_assignments` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `employee_id` on the `employee_holiday_assignments` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `holiday_id` on the `employee_holiday_assignments` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `employee_offboarding` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `employee_offboarding` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `employee_id` on the `employee_offboarding` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `employee_onboarding` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `employee_onboarding` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `employee_id` on the `employee_onboarding` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `employees` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `organization_id` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `user_id` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `department_id` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `job_title_id` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `manager_id` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `holiday_templates` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `holiday_templates` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `organization_id` on the `holiday_templates` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `holidays` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `holidays` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `organization_id` on the `holidays` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `holiday_template_id` on the `holidays` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `job_titles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `job_titles` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `organization_id` on the `job_titles` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `leave_requests` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `leave_requests` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `employee_id` on the `leave_requests` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `organization_offboarding` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `organization_offboarding` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `organization_id` on the `organization_offboarding` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `organization_onboarding` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `organization_onboarding` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `organization_id` on the `organization_onboarding` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `organizations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `organizations` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `payrolls` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `payrolls` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `employee_id` on the `payrolls` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `permissions` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `organization_id` on the `permissions` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `role_permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `role_permissions` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `role_id` on the `role_permissions` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `permission_id` on the `role_permissions` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `roles` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `organization_id` on the `roles` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `sessions` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `userId` on the `sessions` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `timesheets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `timesheets` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `employee_id` on the `timesheets` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `user_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `user_roles` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `user_id` on the `user_roles` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `role_id` on the `user_roles` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `users` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `organization_id` on the `users` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `verification_tokens` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `verification_tokens` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_userId_fkey";

-- DropForeignKey
ALTER TABLE "admins" DROP CONSTRAINT "admins_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "benefits" DROP CONSTRAINT "benefits_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "calendar_holidays" DROP CONSTRAINT "calendar_holidays_calendar_id_fkey";

-- DropForeignKey
ALTER TABLE "calendar_holidays" DROP CONSTRAINT "calendar_holidays_holiday_id_fkey";

-- DropForeignKey
ALTER TABLE "calendars" DROP CONSTRAINT "calendars_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "compensations" DROP CONSTRAINT "compensations_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "deductions" DROP CONSTRAINT "deductions_payroll_id_fkey";

-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_benefits" DROP CONSTRAINT "employee_benefits_benefit_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_benefits" DROP CONSTRAINT "employee_benefits_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_documents" DROP CONSTRAINT "employee_documents_document_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_documents" DROP CONSTRAINT "employee_documents_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_holiday_assignments" DROP CONSTRAINT "employee_holiday_assignments_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_holiday_assignments" DROP CONSTRAINT "employee_holiday_assignments_holiday_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_offboarding" DROP CONSTRAINT "employee_offboarding_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_onboarding" DROP CONSTRAINT "employee_onboarding_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_department_id_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_job_title_id_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_manager_id_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_user_id_fkey";

-- DropForeignKey
ALTER TABLE "holiday_templates" DROP CONSTRAINT "holiday_templates_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "holidays" DROP CONSTRAINT "holidays_holiday_template_id_fkey";

-- DropForeignKey
ALTER TABLE "job_titles" DROP CONSTRAINT "job_titles_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "organization_offboarding" DROP CONSTRAINT "organization_offboarding_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "organization_onboarding" DROP CONSTRAINT "organization_onboarding_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "payrolls" DROP CONSTRAINT "payrolls_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey";

-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- DropForeignKey
ALTER TABLE "timesheets" DROP CONSTRAINT "timesheets_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_role_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_organization_id_fkey";

-- AlterTable
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "userId" SET DATA TYPE INTEGER,
ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "admins" DROP CONSTRAINT "admins_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "organization_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "organization_id" SET DATA TYPE INTEGER,
ALTER COLUMN "user_id" SET DATA TYPE INTEGER,
ALTER COLUMN "entity_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "benefits" DROP CONSTRAINT "benefits_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "organization_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "benefits_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "calendar_holidays" DROP CONSTRAINT "calendar_holidays_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "calendar_id" SET DATA TYPE INTEGER,
ALTER COLUMN "holiday_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "calendar_holidays_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "calendars" DROP CONSTRAINT "calendars_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "organization_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "calendars_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "compensations" DROP CONSTRAINT "compensations_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "employee_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "compensations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "deductions" DROP CONSTRAINT "deductions_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "payroll_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "deductions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "departments" DROP CONSTRAINT "departments_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "organization_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "documents" DROP CONSTRAINT "documents_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "organization_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "employee_benefits" DROP CONSTRAINT "employee_benefits_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "employee_id" SET DATA TYPE INTEGER,
ALTER COLUMN "benefit_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "employee_benefits_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "employee_documents" DROP CONSTRAINT "employee_documents_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "employee_id" SET DATA TYPE INTEGER,
ALTER COLUMN "document_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "employee_holiday_assignments" DROP CONSTRAINT "employee_holiday_assignments_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "employee_id" SET DATA TYPE INTEGER,
ALTER COLUMN "holiday_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "employee_holiday_assignments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "employee_offboarding" DROP CONSTRAINT "employee_offboarding_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "employee_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "employee_offboarding_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "employee_onboarding" DROP CONSTRAINT "employee_onboarding_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "employee_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "employee_onboarding_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "employees" DROP CONSTRAINT "employees_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "organization_id" SET DATA TYPE INTEGER,
ALTER COLUMN "user_id" SET DATA TYPE INTEGER,
ALTER COLUMN "department_id" SET DATA TYPE INTEGER,
ALTER COLUMN "job_title_id" SET DATA TYPE INTEGER,
ALTER COLUMN "manager_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "holiday_templates" DROP CONSTRAINT "holiday_templates_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "organization_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "holiday_templates_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "holidays" DROP CONSTRAINT "holidays_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "organization_id" SET DATA TYPE INTEGER,
ALTER COLUMN "holiday_template_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "holidays_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "job_titles" DROP CONSTRAINT "job_titles_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "organization_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "job_titles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "employee_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "organization_offboarding" DROP CONSTRAINT "organization_offboarding_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "organization_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "organization_offboarding_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "organization_onboarding" DROP CONSTRAINT "organization_onboarding_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "organization_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "organization_onboarding_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_pkey",
ADD COLUMN     "contact_number" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "website" TEXT,
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "payrolls" DROP CONSTRAINT "payrolls_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "employee_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "organization_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "role_id" SET DATA TYPE INTEGER,
ALTER COLUMN "permission_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "roles" DROP CONSTRAINT "roles_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "organization_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "userId" SET DATA TYPE INTEGER,
ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "timesheets" DROP CONSTRAINT "timesheets_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "employee_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "user_id" SET DATA TYPE INTEGER,
ALTER COLUMN "role_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "organization_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "verification_tokens" DROP CONSTRAINT "verification_tokens_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_titles" ADD CONSTRAINT "job_titles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_job_title_id_fkey" FOREIGN KEY ("job_title_id") REFERENCES "job_titles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compensations" ADD CONSTRAINT "compensations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefits" ADD CONSTRAINT "benefits_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_benefits" ADD CONSTRAINT "employee_benefits_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_benefits" ADD CONSTRAINT "employee_benefits_benefit_id_fkey" FOREIGN KEY ("benefit_id") REFERENCES "benefits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_onboarding" ADD CONSTRAINT "employee_onboarding_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_offboarding" ADD CONSTRAINT "employee_offboarding_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_onboarding" ADD CONSTRAINT "organization_onboarding_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_offboarding" ADD CONSTRAINT "organization_offboarding_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deductions" ADD CONSTRAINT "deductions_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "payrolls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday_templates" ADD CONSTRAINT "holiday_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_holiday_template_id_fkey" FOREIGN KEY ("holiday_template_id") REFERENCES "holiday_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_holiday_assignments" ADD CONSTRAINT "employee_holiday_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_holiday_assignments" ADD CONSTRAINT "employee_holiday_assignments_holiday_id_fkey" FOREIGN KEY ("holiday_id") REFERENCES "holidays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendars" ADD CONSTRAINT "calendars_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_holidays" ADD CONSTRAINT "calendar_holidays_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_holidays" ADD CONSTRAINT "calendar_holidays_holiday_id_fkey" FOREIGN KEY ("holiday_id") REFERENCES "holidays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
