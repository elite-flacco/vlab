export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  workspace_layout: WorkspaceLayout;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceLayout {
  modules: ModuleConfig[];
  grid_config: GridConfig;
}

export interface ModuleConfig {
  id: string;
  type: ModuleType;
  position: Position;
  size: Size;
  data: any;
  is_visible: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface GridConfig {
  columns: number;
  rows: number;
  gap: number;
}

export type ModuleType = 'prd' | 'tasks' | 'prompts' | 'scratchpad' | 'roadmap' | 'secrets';

export interface PRD {
  id: string;
  project_id: string;
  title: string;
  content: string;
  version: number;
  status: 'draft' | 'review' | 'approved';
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  estimated_hours?: number;
  actual_hours?: number;
  dependencies: string[];
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: string;
  project_id: string;
  name: string;
  content: string;
  variables: PromptVariable[];
  version: number;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptVariable {
  name: string;
  type: 'text' | 'number' | 'boolean';
  default_value?: any;
  description?: string;
}

export interface ScratchpadNote {
  id: string;
  project_id: string;
  content: string;
  position: Position;
  size: Size;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface RoadmapItem {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  progress: number;
  dependencies: string[];
  milestone: boolean;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Secret {
  id: string;
  project_id: string;
  name: string;
  encrypted_value: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  workspace_layout: WorkspaceLayout;
  is_public: boolean;
  user_id: string;
  download_count: number;
  rating: number;
  created_at: string;
  updated_at: string;
}