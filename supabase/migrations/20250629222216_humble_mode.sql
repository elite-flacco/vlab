/*
  # Add design module type to workspace_modules

  1. Changes
    - Update the CHECK constraint on workspace_modules.module_type to include 'design'
*/

-- Update the CHECK constraint to include 'design' module type
ALTER TABLE workspace_modules 
DROP CONSTRAINT IF EXISTS workspace_modules_module_type_check;

-- Add the new constraint with 'design' included
ALTER TABLE workspace_modules 
ADD CONSTRAINT workspace_modules_module_type_check 
CHECK (module_type IN ('prd', 'tasks', 'prompts', 'scratchpad', 'roadmap', 'secrets', 'design'));