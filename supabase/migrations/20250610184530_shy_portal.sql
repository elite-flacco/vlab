/*
  # Add phase column to roadmap_items table

  1. Schema Changes
    - Add `phase` column to `roadmap_items` table
    - Set default value to 'backlog' for existing records
    - Add CHECK constraint to ensure valid phase values
    - Create index for better query performance

  2. Data Migration
    - Update existing records to have appropriate phase values based on position
    - First item becomes 'mvp', second becomes 'phase_2', rest become 'backlog'

  3. Security
    - No changes to RLS policies needed as they inherit from table-level policies
*/

-- Add the phase column with default value
ALTER TABLE roadmap_items 
ADD COLUMN IF NOT EXISTS phase text DEFAULT 'backlog' NOT NULL;

-- Add CHECK constraint to ensure valid phase values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'roadmap_items_phase_check'
  ) THEN
    ALTER TABLE roadmap_items 
    ADD CONSTRAINT roadmap_items_phase_check 
    CHECK (phase IN ('mvp', 'phase_2', 'backlog'));
  END IF;
END $$;

-- Create index for better query performance on phase column
CREATE INDEX IF NOT EXISTS idx_roadmap_items_phase ON roadmap_items(phase);

-- Migrate existing data: assign phases based on position
-- First item (position 0) -> mvp
-- Second item (position 1) -> phase_2  
-- All others -> backlog (already default)
UPDATE roadmap_items 
SET phase = CASE 
  WHEN position = 0 THEN 'mvp'
  WHEN position = 1 THEN 'phase_2'
  ELSE 'backlog'
END
WHERE phase = 'backlog'; -- Only update records that still have the default value

-- Add comment to document the new column
COMMENT ON COLUMN roadmap_items.phase IS 'Development phase: mvp (minimum viable product), phase_2 (second phase), or backlog (future items)';