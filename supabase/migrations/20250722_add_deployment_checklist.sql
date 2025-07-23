/*
  # Add Deployment Checklist Module

  1. New Tables
    - `deployment_items` - Deployment checklist items for go-live preparation

  2. Updates
    - Update workspace_modules CHECK constraint to include 'deployment' module type

  3. Security
    - Enable RLS on deployment_items table
    - Add policies for authenticated users to manage deployment items in their projects

  4. Features
    - Deployment-specific fields (platform, environment, priority)
    - Completion tracking and progress monitoring
    - Auto-generation support for common deployment tasks
*/

-- Add deployment checklist items table
CREATE TABLE IF NOT EXISTS deployment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'general' CHECK (category IN ('general', 'hosting', 'database', 'auth', 'env', 'security', 'monitoring', 'testing', 'dns', 'ssl')),
  platform text DEFAULT 'general' CHECK (platform IN ('general', 'vercel', 'netlify', 'aws', 'gcp', 'azure', 'heroku', 'digitalocean', 'supabase')),
  environment text DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'blocked', 'not_applicable')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_required boolean DEFAULT true,
  is_auto_generated boolean DEFAULT false,
  estimated_hours numeric(5,2),
  actual_hours numeric(5,2),
  due_date timestamptz,
  completion_date timestamptz,
  tags text[] DEFAULT '{}',
  dependencies uuid[] DEFAULT '{}',
  assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  verification_notes text DEFAULT '',
  helpful_links jsonb DEFAULT '[]',
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Update workspace_modules to include deployment module type
-- First, drop the existing constraint
ALTER TABLE workspace_modules DROP CONSTRAINT IF EXISTS workspace_modules_module_type_check;

-- Add the new constraint with deployment included
ALTER TABLE workspace_modules ADD CONSTRAINT workspace_modules_module_type_check 
  CHECK (module_type IN ('prd', 'tasks', 'prompts', 'scratchpad', 'roadmap', 'secrets', 'deployment'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deployment_items_project_id ON deployment_items(project_id);
CREATE INDEX IF NOT EXISTS idx_deployment_items_status ON deployment_items(status);
CREATE INDEX IF NOT EXISTS idx_deployment_items_category ON deployment_items(category);
CREATE INDEX IF NOT EXISTS idx_deployment_items_platform ON deployment_items(platform);
CREATE INDEX IF NOT EXISTS idx_deployment_items_assignee_id ON deployment_items(assignee_id);
CREATE INDEX IF NOT EXISTS idx_deployment_items_position ON deployment_items(position);

-- Enable Row Level Security
ALTER TABLE deployment_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deployment_items
CREATE POLICY "Users can manage deployment items in own projects"
  ON deployment_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = deployment_items.project_id 
      AND projects.user_id = auth.uid()
    )
  );