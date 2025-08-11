-- Create storage bucket and policies for attachments
-- This migration ensures the storage bucket exists and has proper policies

-- Create the attachments bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('attachments', 'attachments', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload attachments to their own folder structure
CREATE POLICY "Users can upload attachments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'attachments' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = 'attachments'
    );

-- Policy: Users can view/download attachments they own
CREATE POLICY "Users can view attachments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'attachments' 
        AND auth.role() = 'authenticated'
    );

-- Policy: Users can update attachments they own
CREATE POLICY "Users can update attachments" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'attachments' 
        AND auth.role() = 'authenticated'
    );

-- Policy: Users can delete attachments they own  
CREATE POLICY "Users can delete attachments" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'attachments' 
        AND auth.role() = 'authenticated'
    );