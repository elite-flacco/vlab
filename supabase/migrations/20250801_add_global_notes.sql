/*
  # Add Global Notes for Project-Agnostic Scratchpad

  1. New Tables
    - `global_notes` - User-level notes not tied to any specific project

  2. Security
    - Enable RLS on global_notes table
    - Add policies for authenticated users to manage their own global notes

  3. Features
    - Same structure as scratchpad_notes but with user_id instead of project_id
    - Supports title, content, tagging, pinning, search
    - Maintains consistent user experience with project scratchpads
*/

-- Add global_notes table for project-agnostic notes
CREATE TABLE IF NOT EXISTS global_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT '',
  content text NOT NULL,
  position jsonb DEFAULT '{"x": 0, "y": 0}',
  size jsonb DEFAULT '{"width": 300, "height": 200}',
  color text DEFAULT '#fef3c7',
  font_size integer DEFAULT 14,
  is_pinned boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_global_notes_user_id ON global_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_global_notes_is_pinned ON global_notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_global_notes_created_at ON global_notes(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_global_notes_updated_at
  BEFORE UPDATE ON global_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE global_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for global_notes
CREATE POLICY "Users can manage their own global notes"
  ON global_notes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);