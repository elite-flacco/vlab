/*
  # Add Tool and Category Fields to Community Posts

  1. Schema Changes
    - Add `tool` field to community_posts table for tool categorization
    - Add `tip_category` field to community_posts table for tip categorization
    - Add CHECK constraints to ensure valid values
    - Create indexes for better filtering performance

  2. Data Migration
    - Set default values for existing records
    - Ensure backward compatibility

  3. Security
    - No changes to RLS policies needed as they inherit from table-level policies
*/

-- Add tool field for tool categorization
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS tool text;

-- Add tip_category field for tip categorization  
ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS tip_category text;

-- Add CHECK constraints for valid tool values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'community_posts_tool_check'
  ) THEN
    ALTER TABLE community_posts 
    ADD CONSTRAINT community_posts_tool_check 
    CHECK (tool IS NULL OR tool IN ('bolt', 'loveable', 'replit', 'v0', 'other'));
  END IF;
END $$;

-- Add CHECK constraints for valid tip_category values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'community_posts_tip_category_check'
  ) THEN
    ALTER TABLE community_posts 
    ADD CONSTRAINT community_posts_tip_category_check 
    CHECK (tip_category IS NULL OR tip_category IN ('prompt_tricks', 'integrations', 'authentication', 'payment', 'other'));
  END IF;
END $$;

-- Create indexes for better filtering performance
CREATE INDEX IF NOT EXISTS idx_community_posts_tool ON community_posts(tool);
CREATE INDEX IF NOT EXISTS idx_community_posts_tip_category ON community_posts(tip_category);

-- Add comments for documentation
COMMENT ON COLUMN community_posts.tool IS 'Tool categorization for tool posts (bolt, loveable, replit, v0, other)';
COMMENT ON COLUMN community_posts.tip_category IS 'Category for tip posts (prompt_tricks, integrations, authentication, payment, other)';