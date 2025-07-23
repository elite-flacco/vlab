-- Add 'performance' category to deployment_items constraint
-- Migration: Add performance category to deployment_items_category_check

-- Drop the existing constraint
ALTER TABLE deployment_items 
DROP CONSTRAINT IF EXISTS deployment_items_category_check;

-- Recreate the constraint with 'performance' included
ALTER TABLE deployment_items 
ADD CONSTRAINT deployment_items_category_check 
CHECK (category IN (
  'general', 
  'hosting', 
  'database', 
  'auth', 
  'env', 
  'security', 
  'monitoring', 
  'testing', 
  'dns', 
  'ssl', 
  'performance'
));