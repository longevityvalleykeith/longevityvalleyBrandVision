-- Add 'processing' value to vision_job_status enum
ALTER TYPE vision_job_status ADD VALUE IF NOT EXISTS 'processing' AFTER 'pending';
