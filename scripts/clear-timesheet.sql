-- Clear all working time records (TimeEntry and TimeBreak)
-- Usage: psql -U <user> -d <database> -f scripts/clear-timesheet.sql

-- Delete all TimeBreak records first (due to foreign key constraint)
DELETE FROM "TimeBreak";

-- Delete all TimeEntry records
DELETE FROM "TimeEntry";

-- Print confirmation
SELECT 'Successfully cleared all timesheet records!' as status;
