/*
  # Simplify Post Categories

  1. Schema Changes
    - Remove the `category` column from `community_posts` table
    - Remove the `community_posts_category_check` constraint
    - Allow posts to have both `tool` and `tip_category` values

  2. Security
    - Maintain existing RLS policies
    - Update any policies that reference the `category` column

  3. Notes
    - This migration allows more flexible post categorization
    - Posts can now be tagged with both tool and tip categories
    - Existing data will be preserved (tool and tip_category columns remain)
*/

-- Remove the category check constraint
ALTER TABLE community_posts DROP CONSTRAINT IF EXISTS community_posts_category_check;

-- Remove the category column
ALTER TABLE community_posts DROP COLUMN IF EXISTS category;

-- Update any indexes that might reference the category column
DROP INDEX IF EXISTS idx_community_posts_category;

-- Recreate search index without category
DROP INDEX IF EXISTS idx_community_posts_search;
CREATE INDEX idx_community_posts_search ON community_posts USING gin (to_tsvector('english'::regconfig, ((title || ' '::text) || content)));