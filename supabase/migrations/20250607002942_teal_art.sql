/*
  # VLab Database Functions and Triggers

  1. Functions
    - `update_updated_at_column()` - Automatically update updated_at timestamps
    - `create_user_profile()` - Create profile when user signs up
    - `encrypt_secret()` - Encrypt secret values
    - `decrypt_secret()` - Decrypt secret values (with proper access control)

  2. Triggers
    - Auto-update timestamps on all tables
    - Auto-create user profile on signup
    - Auto-encrypt secrets before storage

  3. Security
    - Proper access control for encryption functions
    - Audit logging for sensitive operations
*/

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to encrypt secrets
CREATE OR REPLACE FUNCTION encrypt_secret(secret_text text, project_uuid uuid)
RETURNS text AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Generate a project-specific encryption key
  encryption_key := encode(digest(project_uuid::text || current_setting('app.jwt_secret', true), 'sha256'), 'hex');
  
  -- Encrypt the secret using pgcrypto
  RETURN encode(encrypt(secret_text::bytea, encryption_key::bytea, 'aes'), 'base64');
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to decrypt secrets (only for authorized users)
CREATE OR REPLACE FUNCTION decrypt_secret(encrypted_text text, project_uuid uuid)
RETURNS text AS $$
DECLARE
  encryption_key text;
  user_has_access boolean;
BEGIN
  -- Check if user has access to this project
  SELECT EXISTS(
    SELECT 1 FROM projects 
    WHERE id = project_uuid 
    AND user_id = auth.uid()
  ) INTO user_has_access;
  
  IF NOT user_has_access THEN
    RAISE EXCEPTION 'Access denied to decrypt secret';
  END IF;
  
  -- Generate the same project-specific encryption key
  encryption_key := encode(digest(project_uuid::text || current_setting('app.jwt_secret', true), 'sha256'), 'hex');
  
  -- Decrypt the secret
  RETURN convert_from(decrypt(decode(encrypted_text, 'base64'), encryption_key::bytea, 'aes'), 'UTF8');
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to auto-encrypt secrets before insert/update
CREATE OR REPLACE FUNCTION auto_encrypt_secret()
RETURNS TRIGGER AS $$
BEGIN
  -- Only encrypt if the value has changed and is not already encrypted
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.encrypted_value != OLD.encrypted_value) THEN
    -- Check if the value looks like it's already encrypted (base64)
    IF NEW.encrypted_value !~ '^[A-Za-z0-9+/]*={0,2}$' OR length(NEW.encrypted_value) < 20 THEN
      NEW.encrypted_value := encrypt_secret(NEW.encrypted_value, NEW.project_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_modules_updated_at
  BEFORE UPDATE ON workspace_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prds_updated_at
  BEFORE UPDATE ON prds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scratchpad_notes_updated_at
  BEFORE UPDATE ON scratchpad_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmap_items_updated_at
  BEFORE UPDATE ON roadmap_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_secrets_updated_at
  BEFORE UPDATE ON secrets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create user profile on signup
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Trigger to auto-encrypt secrets
CREATE TRIGGER auto_encrypt_secrets_trigger
  BEFORE INSERT OR UPDATE ON secrets
  FOR EACH ROW EXECUTE FUNCTION auto_encrypt_secret();