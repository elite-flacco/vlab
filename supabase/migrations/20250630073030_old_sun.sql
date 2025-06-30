/*
  # Update Profiles RLS Policy

  1. Changes
     - Drop the existing restrictive SELECT policy on profiles
     - Add a new policy to allow authenticated users to view all profiles
     - This fixes the "Cannot read properties of null (reading 'name')" error in the Community page

  2. Security
     - This policy allows authenticated users to view all profiles
     - This is necessary for the Community feature to work properly
     - In a production environment, consider creating a more granular approach with a separate view for public profile info
*/

-- Drop the existing restrictive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Add a new policy to allow authenticated users to view all profiles
CREATE POLICY "Allow authenticated users to view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);