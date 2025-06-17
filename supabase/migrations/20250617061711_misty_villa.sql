/*
  # Add PRD Versioning System

  1. Schema Changes
    - Add version tracking fields to PRDs table
    - Create PRD versions history table
    - Add change tracking and comparison support

  2. New Tables
    - `prd_versions` - Complete history of all PRD versions
    - Track changes, authors, and timestamps

  3. Functions
    - Auto-increment version numbers
    - Create version snapshots on updates

  4. Security
    - Enable RLS on new tables
    - Add policies for version access control
*/

-- Add versioning fields to existing PRDs table if they don't exist
DO $$
BEGIN
  -- Add change_description field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prds' AND column_name = 'change_description'
  ) THEN
    ALTER TABLE prds ADD COLUMN change_description text;
  END IF;

  -- Add created_by field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prds' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE prds ADD COLUMN created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  -- Add updated_by field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prds' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE prds ADD COLUMN updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create PRD versions history table
CREATE TABLE IF NOT EXISTS prd_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id uuid REFERENCES prds(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  change_description text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure unique version numbers per PRD
  UNIQUE(prd_id, version_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prd_versions_prd_id ON prd_versions(prd_id);
CREATE INDEX IF NOT EXISTS idx_prd_versions_version_number ON prd_versions(prd_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_prd_versions_created_at ON prd_versions(created_at DESC);

-- Function to create a new version when PRD is updated
CREATE OR REPLACE FUNCTION create_prd_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content actually changed
  IF TG_OP = 'UPDATE' AND (OLD.title != NEW.title OR OLD.content != NEW.content) THEN
    -- Insert the OLD version into history before the update
    INSERT INTO prd_versions (prd_id, version_number, title, content, change_description, created_by, created_at)
    VALUES (
      OLD.id,
      OLD.version,
      OLD.title,
      OLD.content,
      OLD.change_description,
      OLD.updated_by,
      OLD.updated_at
    );
    
    -- Increment version number for the new version
    NEW.version = OLD.version + 1;
    NEW.updated_by = auth.uid();
  END IF;
  
  -- For INSERT, set initial values
  IF TG_OP = 'INSERT' THEN
    NEW.version = COALESCE(NEW.version, 1);
    NEW.created_by = COALESCE(NEW.created_by, auth.uid());
    NEW.updated_by = COALESCE(NEW.updated_by, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for version management
DROP TRIGGER IF EXISTS prd_versioning_trigger ON prds;
CREATE TRIGGER prd_versioning_trigger
  BEFORE INSERT OR UPDATE ON prds
  FOR EACH ROW EXECUTE FUNCTION create_prd_version();

-- Enable RLS on prd_versions table
ALTER TABLE prd_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prd_versions
CREATE POLICY "Users can view versions of PRDs in own projects"
  ON prd_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prds 
      JOIN projects ON prds.project_id = projects.id
      WHERE prds.id = prd_versions.prd_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions for PRDs in own projects"
  ON prd_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prds 
      JOIN projects ON prds.project_id = projects.id
      WHERE prds.id = prd_versions.prd_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Function to get version comparison data
CREATE OR REPLACE FUNCTION get_prd_version_comparison(
  prd_uuid uuid,
  version_a integer,
  version_b integer
)
RETURNS TABLE(
  version_a_data jsonb,
  version_b_data jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH version_a_query AS (
    SELECT 
      jsonb_build_object(
        'version', version_a,
        'title', CASE 
          WHEN version_a = (SELECT version FROM prds WHERE id = prd_uuid) 
          THEN (SELECT title FROM prds WHERE id = prd_uuid)
          ELSE (SELECT title FROM prd_versions WHERE prd_id = prd_uuid AND version_number = version_a)
        END,
        'content', CASE 
          WHEN version_a = (SELECT version FROM prds WHERE id = prd_uuid) 
          THEN (SELECT content FROM prds WHERE id = prd_uuid)
          ELSE (SELECT content FROM prd_versions WHERE prd_id = prd_uuid AND version_number = version_a)
        END,
        'created_at', CASE 
          WHEN version_a = (SELECT version FROM prds WHERE id = prd_uuid) 
          THEN (SELECT updated_at FROM prds WHERE id = prd_uuid)
          ELSE (SELECT created_at FROM prd_versions WHERE prd_id = prd_uuid AND version_number = version_a)
        END
      ) as data
  ),
  version_b_query AS (
    SELECT 
      jsonb_build_object(
        'version', version_b,
        'title', CASE 
          WHEN version_b = (SELECT version FROM prds WHERE id = prd_uuid) 
          THEN (SELECT title FROM prds WHERE id = prd_uuid)
          ELSE (SELECT title FROM prd_versions WHERE prd_id = prd_uuid AND version_number = version_b)
        END,
        'content', CASE 
          WHEN version_b = (SELECT version FROM prds WHERE id = prd_uuid) 
          THEN (SELECT content FROM prds WHERE id = prd_uuid)
          ELSE (SELECT content FROM prd_versions WHERE prd_id = prd_uuid AND version_number = version_b)
        END,
        'created_at', CASE 
          WHEN version_b = (SELECT version FROM prds WHERE id = prd_uuid) 
          THEN (SELECT updated_at FROM prds WHERE id = prd_uuid)
          ELSE (SELECT created_at FROM prd_versions WHERE prd_id = prd_uuid AND version_number = version_b)
        END
      ) as data
  )
  SELECT 
    version_a_query.data as version_a_data,
    version_b_query.data as version_b_data
  FROM version_a_query, version_b_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the comparison function
GRANT EXECUTE ON FUNCTION get_prd_version_comparison(uuid, integer, integer) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE prd_versions IS 'Complete version history for all PRD documents';
COMMENT ON COLUMN prd_versions.version_number IS 'Sequential version number for each PRD';
COMMENT ON COLUMN prd_versions.change_description IS 'Brief description of changes made in this version';
COMMENT ON FUNCTION create_prd_version() IS 'Automatically creates version snapshots when PRDs are updated';
COMMENT ON FUNCTION get_prd_version_comparison(uuid, integer, integer) IS 'Returns comparison data for two PRD versions';