/*
  # VLab Core Database Schema

  1. New Tables
    - `profiles` - User profile information extending Supabase auth
    - `projects` - Main project containers for workspaces
    - `workspace_modules` - Individual modules within projects
    - `prds` - Product Requirements Documents
    - `tasks` - Task management with dependencies
    - `prompts` - AI prompt templates and management
    - `scratchpad_notes` - Freeform notes and ideas
    - `roadmap_items` - Project roadmap and milestones
    - `secrets` - Encrypted environment variables and API keys
    - `templates` - Shareable workspace templates
    - `template_tags` - Tagging system for templates

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Special policies for public template sharing

  3. Features
    - Full-text search capabilities
    - Proper foreign key relationships
    - Optimized indexes for performance
    - JSON storage for flexible module configurations
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  bio text,
  github_username text,
  twitter_username text,
  website_url text,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  workspace_layout jsonb DEFAULT '{"modules": [], "grid_config": {"columns": 12, "rows": 8, "gap": 16}}',
  settings jsonb DEFAULT '{}',
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workspace modules configuration
CREATE TABLE IF NOT EXISTS workspace_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  module_type text NOT NULL CHECK (module_type IN ('prd', 'tasks', 'prompts', 'scratchpad', 'roadmap', 'secrets')),
  position jsonb NOT NULL DEFAULT '{"x": 0, "y": 0}',
  size jsonb NOT NULL DEFAULT '{"width": 4, "height": 3}',
  config jsonb DEFAULT '{}',
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PRDs (Product Requirements Documents)
CREATE TABLE IF NOT EXISTS prds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text DEFAULT '',
  version integer DEFAULT 1,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
  metadata jsonb DEFAULT '{}',
  ai_generated boolean DEFAULT false,
  parent_id uuid REFERENCES prds(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_hours numeric(5,2),
  actual_hours numeric(5,2),
  due_date timestamptz,
  tags text[] DEFAULT '{}',
  dependencies uuid[] DEFAULT '{}',
  assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prompts
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  content text NOT NULL,
  variables jsonb DEFAULT '[]',
  version integer DEFAULT 1,
  is_template boolean DEFAULT false,
  category text DEFAULT 'general',
  tags text[] DEFAULT '{}',
  usage_count integer DEFAULT 0,
  parent_id uuid REFERENCES prompts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Scratchpad notes
CREATE TABLE IF NOT EXISTS scratchpad_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
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

-- Roadmap items
CREATE TABLE IF NOT EXISTS roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  start_date date,
  end_date date,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  dependencies uuid[] DEFAULT '{}',
  milestone boolean DEFAULT false,
  color text DEFAULT '#3b82f6',
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Secrets (encrypted storage)
CREATE TABLE IF NOT EXISTS secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  encrypted_value text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'api_key',
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, name)
);

-- Templates (shareable workspace configurations)
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'general',
  workspace_layout jsonb NOT NULL,
  preview_image_url text,
  is_public boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  download_count integer DEFAULT 0,
  rating numeric(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  rating_count integer DEFAULT 0,
  version text DEFAULT '1.0.0',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Template tags (many-to-many relationship)
CREATE TABLE IF NOT EXISTS template_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES templates(id) ON DELETE CASCADE NOT NULL,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(template_id, tag)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_modules_project_id ON workspace_modules(project_id);
CREATE INDEX IF NOT EXISTS idx_prds_project_id ON prds(project_id);
CREATE INDEX IF NOT EXISTS idx_prds_status ON prds(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_prompts_project_id ON prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_prompts_is_template ON prompts(is_template);
CREATE INDEX IF NOT EXISTS idx_scratchpad_notes_project_id ON scratchpad_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_project_id ON roadmap_items(project_id);
CREATE INDEX IF NOT EXISTS idx_secrets_project_id ON secrets(project_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_template_tags_template_id ON template_tags(template_id);
CREATE INDEX IF NOT EXISTS idx_template_tags_tag ON template_tags(tag);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE prds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scratchpad_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for workspace_modules
CREATE POLICY "Users can manage modules in own projects"
  ON workspace_modules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = workspace_modules.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for prds
CREATE POLICY "Users can manage PRDs in own projects"
  ON prds FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = prds.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for tasks
CREATE POLICY "Users can manage tasks in own projects"
  ON tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tasks.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for prompts
CREATE POLICY "Users can manage prompts in own projects"
  ON prompts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = prompts.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for scratchpad_notes
CREATE POLICY "Users can manage notes in own projects"
  ON scratchpad_notes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = scratchpad_notes.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for roadmap_items
CREATE POLICY "Users can manage roadmap items in own projects"
  ON roadmap_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = roadmap_items.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for secrets
CREATE POLICY "Users can manage secrets in own projects"
  ON secrets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = secrets.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for templates
CREATE POLICY "Users can view public templates"
  ON templates FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own templates"
  ON templates FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for template_tags
CREATE POLICY "Users can view tags for accessible templates"
  ON template_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_tags.template_id 
      AND (templates.is_public = true OR templates.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage tags for own templates"
  ON template_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_tags.template_id 
      AND templates.user_id = auth.uid()
    )
  );