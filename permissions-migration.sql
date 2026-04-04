-- Add permissions column to app_users
-- Run this in Supabase SQL Editor

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS
  permissions jsonb DEFAULT '{
    "residents": true,
    "blotter": true,
    "certificates": true,
    "settlements": true,
    "officials": true,
    "business": true
  }'::jsonb;

-- Update existing admin to have all permissions
UPDATE app_users SET permissions = '{
  "residents": true,
  "blotter": true,
  "certificates": true,
  "settlements": true,
  "officials": true,
  "business": true
}'::jsonb WHERE role = 'Admin';
