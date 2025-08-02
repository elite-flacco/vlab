/*
  # Add GitHub Integration

  This migration adds tables and functionality for GitHub integration:
  - GitHub repositories linked to projects
  - GitHub authentication tokens (encrypted)
  - Issue creation tracking
*/

-- GitHub repositories table
CREATE TABLE IF NOT EXISTS github_repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  repo_owner text NOT NULL,
  repo_name text NOT NULL,
  repo_full_name text NOT NULL, -- e.g., "owner/repo"
  repo_url text NOT NULL,
  default_branch text DEFAULT 'main',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique repo per project
  UNIQUE(project_id, repo_full_name)
);

-- GitHub authentication tokens (encrypted storage)
CREATE TABLE IF NOT EXISTS github_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  encrypted_token text NOT NULL,
  token_scope text[] DEFAULT '{}', -- GitHub OAuth scopes
  github_username text,
  github_user_id text,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- One active token per user
  UNIQUE(user_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- GitHub issues tracking (for created issues)
CREATE TABLE IF NOT EXISTS github_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  repository_id uuid REFERENCES github_repositories(id) ON DELETE CASCADE NOT NULL,
  github_issue_number integer NOT NULL,
  github_issue_url text NOT NULL,
  issue_title text NOT NULL,
  issue_body text,
  github_issue_state text DEFAULT 'open', -- open, closed
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique issue per task
  UNIQUE(task_id),
  -- Ensure unique GitHub issue per repo
  UNIQUE(repository_id, github_issue_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_github_repositories_project_id ON github_repositories(project_id);
CREATE INDEX IF NOT EXISTS idx_github_repositories_user_id ON github_repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_github_tokens_user_id ON github_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_github_issues_task_id ON github_issues(task_id);
CREATE INDEX IF NOT EXISTS idx_github_issues_repository_id ON github_issues(repository_id);

-- Create indexes for updated_at fields for sorting
CREATE INDEX IF NOT EXISTS idx_github_repositories_updated_at ON github_repositories(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_github_tokens_updated_at ON github_tokens(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_github_issues_updated_at ON github_issues(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE github_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_issues ENABLE ROW LEVEL SECURITY;

-- RLS Policies for github_repositories
CREATE POLICY "Users can manage repositories in their projects"
  ON github_repositories FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for github_tokens
CREATE POLICY "Users can manage own GitHub tokens"
  ON github_tokens FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for github_issues
CREATE POLICY "Users can view issues in their projects"
  ON github_issues FOR SELECT
  TO authenticated
  USING (
    repository_id IN (
      SELECT id FROM github_repositories 
      WHERE user_id = auth.uid() OR project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create issues in their projects"
  ON github_issues FOR INSERT
  TO authenticated
  WITH CHECK (
    repository_id IN (
      SELECT id FROM github_repositories 
      WHERE user_id = auth.uid() OR project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update issues they created"
  ON github_issues FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    repository_id IN (
      SELECT id FROM github_repositories 
      WHERE user_id = auth.uid() OR project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

-- Add trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_github_repositories_updated_at 
  BEFORE UPDATE ON github_repositories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_github_tokens_updated_at 
  BEFORE UPDATE ON github_tokens 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_github_issues_updated_at 
  BEFORE UPDATE ON github_issues 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();