-- Add 'universal' platform to deployment_items constraint
-- Migration: Add universal platform to deployment_items_platform_check

-- Drop the existing constraint if it exists
ALTER TABLE deployment_items 
DROP CONSTRAINT IF EXISTS deployment_items_platform_check;

-- Recreate the constraint with 'universal' included
ALTER TABLE deployment_items 
ADD CONSTRAINT deployment_items_platform_check 
CHECK (platform IN (
  'universal',
  'vercel', 
  'netlify', 
  'aws', 
  'gcp', 
  'azure', 
  'heroku', 
  'digitalocean', 
  'supabase'
));