-- Create PayrollStatus enum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'COMPUTED', 'APPROVED', 'RELEASED', 'VOIDED');

-- Add status and audit fields to Payroll table
ALTER TABLE "payrolls" 
ADD COLUMN "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "approved_at" TIMESTAMP(3),
ADD COLUMN "approved_by" TEXT,
ADD COLUMN "released_at" TIMESTAMP(3),
ADD COLUMN "released_by" TEXT,
ADD COLUMN "voided_at" TIMESTAMP(3),
ADD COLUMN "voided_by" TEXT,
ADD COLUMN "void_reason" TEXT;

-- Create index for status
CREATE INDEX "payrolls_status_idx" ON "payrolls"("status");

-- Create PayrollLog table
CREATE TABLE "payroll_logs" (
    "id" TEXT NOT NULL,
    "payroll_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previous_status" TEXT,
    "new_status" TEXT,
    "reason" TEXT,
    "user_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_logs_pkey" PRIMARY KEY ("id")
);

-- Create indexes for PayrollLog
CREATE INDEX "payroll_logs_payroll_id_idx" ON "payroll_logs"("payroll_id");
CREATE INDEX "payroll_logs_user_id_idx" ON "payroll_logs"("user_id");
CREATE INDEX "payroll_logs_timestamp_idx" ON "payroll_logs"("timestamp");

-- Add foreign key constraints
ALTER TABLE "payroll_logs" ADD CONSTRAINT "payroll_logs_payroll_id_fkey" 
    FOREIGN KEY ("payroll_id") REFERENCES "payrolls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payroll_logs" ADD CONSTRAINT "payroll_logs_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add relationship to User model (if not already exists)
-- This would be handled by Prisma when regenerating the client
