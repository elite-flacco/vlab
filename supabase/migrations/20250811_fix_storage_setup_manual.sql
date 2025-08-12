-- Storage Setup Instructions for Attachments Feature
-- 
-- This migration cannot be run directly because it requires Supabase admin privileges.
-- Instead, follow these manual steps in your Supabase Dashboard:

-- STEP 1: Create Storage Bucket
-- Go to Storage > Create Bucket in Supabase Dashboard
-- Bucket name: attachments
-- Public: false (unchecked)
-- File size limit: 10 MB (10485760 bytes)
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- STEP 2: Create Storage Policies
-- Go to Storage > attachments bucket > Policies
-- Add these policies:

-- Policy 1: "Users can upload attachments"
-- Operation: INSERT
-- Policy: 
-- bucket_id = 'attachments' 
-- AND auth.role() = 'authenticated'
-- AND (storage.foldername(name))[1] = 'attachments'

-- Policy 2: "Users can view attachments"  
-- Operation: SELECT
-- Policy:
-- bucket_id = 'attachments' 
-- AND auth.role() = 'authenticated'

-- Policy 3: "Users can update attachments"
-- Operation: UPDATE
-- Policy:
-- bucket_id = 'attachments' 
-- AND auth.role() = 'authenticated'

-- Policy 4: "Users can delete attachments"
-- Operation: DELETE  
-- Policy:
-- bucket_id = 'attachments' 
-- AND auth.role() = 'authenticated'

-- ALTERNATIVE: If you have Supabase CLI access, run:
-- supabase storage create attachments --public=false --file-size-limit=10485760
-- Then add the policies above through the dashboard

-- This file serves as documentation only - no SQL commands to execute
SELECT 'Storage setup requires manual configuration via Supabase Dashboard' as setup_status;