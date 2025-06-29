/*
  # VLab Sample Data

  1. Sample Templates
    - Basic workspace template
    - Development project template
    - Research project template

  2. Sample Tags
    - Common tags for templates

  3. Features
    - Demonstrates the template system
    - Provides starting points for new users
*/

-- Insert sample public templates (these will be created by a system user)
-- Note: In production, these would be created by admin users

-- Sample template tags for categorization
INSERT INTO template_tags (template_id, tag) 
SELECT t.id, unnest(ARRAY['starter', 'basic', 'beginner'])
FROM templates t 
WHERE t.name = 'Basic Workspace'
ON CONFLICT (template_id, tag) DO NOTHING;

-- Create some common workspace layouts as examples
-- These would typically be created through the UI, but we're adding them as examples

-- Note: The actual template creation will happen through the application
-- since we need real user IDs. This file serves as documentation for
-- the types of templates we want to support.

/*
Example template structures:

1. Basic Workspace:
{
  "modules": [
    {
      "id": "scratchpad-1",
      "type": "scratchpad",
      "position": {"x": 0, "y": 0},
      "size": {"width": 6, "height": 4},
      "config": {"defaultColor": "#fef3c7"}
    },
    {
      "id": "tasks-1", 
      "type": "tasks",
      "position": {"x": 6, "y": 0},
      "size": {"width": 6, "height": 4},
      "config": {"defaultView": "kanban"}
    }
  ],
  "grid_config": {
    "columns": 12,
    "rows": 8,
    "gap": 16
  }
}

2. Development Project:
{
  "modules": [
    {
      "id": "prd-1",
      "type": "prd", 
      "position": {"x": 0, "y": 0},
      "size": {"width": 8, "height": 6},
      "config": {"template": "technical"}
    },
    {
      "id": "tasks-1",
      "type": "tasks",
      "position": {"x": 8, "y": 0}, 
      "size": {"width": 4, "height": 6},
      "config": {"defaultView": "list"}
    },
    {
      "id": "roadmap-1",
      "type": "roadmap",
      "position": {"x": 0, "y": 6},
      "size": {"width": 12, "height": 2},
      "config": {"viewType": "timeline"}
    }
  ],
  "grid_config": {
    "columns": 12,
    "rows": 8, 
    "gap": 16
  }
}

3. Research Project:
{
  "modules": [
    {
      "id": "scratchpad-1",
      "type": "scratchpad",
      "position": {"x": 0, "y": 0},
      "size": {"width": 4, "height": 4},
      "config": {"allowMarkdown": true}
    },
    {
      "id": "prompts-1",
      "type": "prompts", 
      "position": {"x": 4, "y": 0},
      "size": {"width": 4, "height": 4},
      "config": {"category": "research"}
    },
    {
      "id": "tasks-1",
      "type": "tasks",
      "position": {"x": 8, "y": 0},
      "size": {"width": 4, "height": 4},
      "config": {"defaultView": "calendar"}
    },
    {
      "id": "roadmap-1", 
      "type": "roadmap",
      "position": {"x": 0, "y": 4},
      "size": {"width": 12, "height": 4},
      "config": {"viewType": "gantt"}
    }
  ],
  "grid_config": {
    "columns": 12,
    "rows": 8,
    "gap": 16
  }
}
*/