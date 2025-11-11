-- Fix Anonymous User Support (Safe version without CASCADE)
-- This migration adds proper support for anonymous users in the profiles table

-- 1. Add missing columns for anonymous user tracking
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS anonymous_claimed_at timestamptz;

-- 2. Mark existing users with NULL emails as anonymous (if any exist)
-- Do this BEFORE changing constraints to maintain data consistency
UPDATE profiles
SET is_anonymous = true
WHERE email IS NULL AND is_anonymous IS NULL;

-- 3. Mark remaining users as non-anonymous
UPDATE profiles
SET is_anonymous = false
WHERE is_anonymous IS NULL;

-- 4. Modify email constraint to allow nulls for anonymous users
ALTER TABLE profiles
  ALTER COLUMN email DROP NOT NULL;

-- 5. Add a check constraint to ensure non-anonymous users have emails
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_email_required_for_non_anonymous;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_email_required_for_non_anonymous
  CHECK (is_anonymous = true OR email IS NOT NULL);

-- 6. Create a unique partial index for non-null emails only
-- This allows multiple anonymous users with NULL emails
-- Drop the constraint (not the index) - this will automatically drop the backing index
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx
  ON profiles(email)
  WHERE email IS NOT NULL;

-- 7. Add index for querying anonymous users
CREATE INDEX IF NOT EXISTS idx_profiles_is_anonymous
  ON profiles(is_anonymous)
  WHERE is_anonymous = true;

-- 8. Drop the old trigger first (safer without CASCADE)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 9. Update the handle_new_user function to properly handle anonymous users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_is_anonymous boolean;
  user_name text;
BEGIN
  SET search_path = public, auth;

  -- Check if this is an anonymous user
  user_is_anonymous := COALESCE((NEW.raw_user_meta_data->>'is_anonymous')::boolean, false);

  -- Determine the user's name
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    CASE
      WHEN user_is_anonymous THEN 'Guest User'
      WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1)
      ELSE 'User'
    END
  );

  RAISE LOG 'handle_new_user called - user_id: %, email: %, is_anonymous: %, name: %',
    NEW.id, NEW.email, user_is_anonymous, user_name;

  BEGIN
    -- Insert the profile
    INSERT INTO public.profiles (id, email, name, is_anonymous)
    VALUES (
      NEW.id,
      NEW.email, -- Can be NULL for anonymous users
      user_name,
      user_is_anonymous
    );

    RAISE LOG 'Successfully created profile for user: % (anonymous: %)',
      COALESCE(NEW.email, 'no-email'), user_is_anonymous;

  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: SQLSTATE=%, SQLERRM=%',
      NEW.id, SQLSTATE, SQLERRM;
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Set proper ownership
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 11. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- 13. Update RLS policies to support anonymous users
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Anonymous users can view their own profile" ON profiles;

-- Recreate policies with anonymous user support
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

-- 14. Add helpful comments
COMMENT ON COLUMN profiles.is_anonymous IS 'Flag indicating if this is an anonymous/guest user account';
COMMENT ON COLUMN profiles.anonymous_claimed_at IS 'Timestamp when an anonymous account was claimed and converted to a regular account';
