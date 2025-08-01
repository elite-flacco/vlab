/*
  # Add Global Notes Table
  
  This migration adds a new table for project-agnostic notes that belong directly to users.
  The structure is similar to scratchpad_notes but references users directly instead of projects.
*/

-- Global notes table (project-agnostic notes)
CREATE TABLE IF NOT EXISTS global_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text,
  content text NOT NULL,
  position jsonb DEFAULT '{"x": 0, "y": 0}',
  size jsonb DEFAULT '{"width": 200, "height": 150}',
  color text DEFAULT '#fef3c7',
  font_size integer DEFAULT 14,
  is_pinned boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_global_notes_user_id ON global_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_global_notes_updated_at ON global_notes(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE global_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for global_notes
CREATE POLICY "Users can manage own global notes"
  ON global_notes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);