-- Add attachment support for tasks and notes
-- This migration adds a table to store file attachments with references to tasks or notes

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Reference to either task or scratchpad note
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NULL,
    scratchpad_note_id UUID REFERENCES scratchpad_notes(id) ON DELETE CASCADE NULL,
    
    -- File metadata
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    
    -- Display metadata
    alt_text TEXT,
    caption TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure attachment belongs to either a task OR a note (not both or neither)
ALTER TABLE attachments ADD CONSTRAINT attachments_reference_check 
    CHECK (
        (task_id IS NOT NULL AND scratchpad_note_id IS NULL) OR 
        (task_id IS NULL AND scratchpad_note_id IS NOT NULL)
    );

-- Indexes for performance
CREATE INDEX idx_attachments_task_id ON attachments(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_attachments_scratchpad_note_id ON attachments(scratchpad_note_id) WHERE scratchpad_note_id IS NOT NULL;
CREATE INDEX idx_attachments_created_at ON attachments(created_at);

-- RLS (Row Level Security)
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access attachments for their own projects
CREATE POLICY "Users can view attachments from their own projects" ON attachments
    FOR SELECT USING (
        (
            task_id IN (
                SELECT t.id FROM tasks t 
                JOIN projects p ON t.project_id = p.id 
                WHERE p.user_id = auth.uid()
            )
        ) OR (
            scratchpad_note_id IN (
                SELECT sn.id FROM scratchpad_notes sn 
                JOIN projects p ON sn.project_id = p.id 
                WHERE p.user_id = auth.uid()
            )
        )
    );

-- Policy: Users can insert attachments for their own projects
CREATE POLICY "Users can insert attachments for their own projects" ON attachments
    FOR INSERT WITH CHECK (
        (
            task_id IN (
                SELECT t.id FROM tasks t 
                JOIN projects p ON t.project_id = p.id 
                WHERE p.user_id = auth.uid()
            )
        ) OR (
            scratchpad_note_id IN (
                SELECT sn.id FROM scratchpad_notes sn 
                JOIN projects p ON sn.project_id = p.id 
                WHERE p.user_id = auth.uid()
            )
        )
    );

-- Policy: Users can update attachments for their own projects  
CREATE POLICY "Users can update attachments for their own projects" ON attachments
    FOR UPDATE USING (
        (
            task_id IN (
                SELECT t.id FROM tasks t 
                JOIN projects p ON t.project_id = p.id 
                WHERE p.user_id = auth.uid()
            )
        ) OR (
            scratchpad_note_id IN (
                SELECT sn.id FROM scratchpad_notes sn 
                JOIN projects p ON sn.project_id = p.id 
                WHERE p.user_id = auth.uid()
            )
        )
    );

-- Policy: Users can delete attachments for their own projects
CREATE POLICY "Users can delete attachments for their own projects" ON attachments
    FOR DELETE USING (
        (
            task_id IN (
                SELECT t.id FROM tasks t 
                JOIN projects p ON t.project_id = p.id 
                WHERE p.user_id = auth.uid()
            )
        ) OR (
            scratchpad_note_id IN (
                SELECT sn.id FROM scratchpad_notes sn 
                JOIN projects p ON sn.project_id = p.id 
                WHERE p.user_id = auth.uid()
            )
        )
    );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_attachments_updated_at BEFORE UPDATE ON attachments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for attachments if it doesn't exist
-- This would normally be done through the Supabase dashboard or CLI, but we can reference it here
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('attachments', 'attachments', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
-- ON CONFLICT (id) DO NOTHING;