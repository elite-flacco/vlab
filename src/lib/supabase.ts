import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { withTimeout, withTiming } from './utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Default timeout for database operations (10 seconds)
const DB_TIMEOUT = 10000;

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, name: string) => {
    const operation = () => supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    
    return withTimeout(
      withTiming('Auth SignUp', operation),
      DB_TIMEOUT,
      'Sign up operation timed out'
    );
  },

  signIn: async (email: string, password: string) => {
    const operation = () => supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return withTimeout(
      withTiming('Auth SignIn', operation),
      DB_TIMEOUT,
      'Sign in operation timed out'
    );
  },

  signOut: async () => {
    const operation = () => supabase.auth.signOut();
    
    return withTimeout(
      withTiming('Auth SignOut', operation),
      DB_TIMEOUT,
      'Sign out operation timed out'
    );
  },

  getCurrentUser: async () => {
    const operation = () => supabase.auth.getUser();
    
    return withTimeout(
      withTiming('Auth GetCurrentUser', operation),
      DB_TIMEOUT,
      'Get current user operation timed out'
    );
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helpers
export const db = {
  // Profiles
  getProfile: async (userId: string) => {
    console.log('📊 DB: Getting profile for user:', userId);
    const operation = () => supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return withTimeout(
      withTiming('DB GetProfile', operation),
      DB_TIMEOUT,
      'Get profile operation timed out'
    );
  },

  updateProfile: async (userId: string, updates: any) => {
    console.log('📊 DB: Updating profile for user:', userId, 'with updates:', updates);
    const operation = () => supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB UpdateProfile', operation),
      DB_TIMEOUT,
      'Update profile operation timed out'
    );
  },

  // Projects
  getProject: async (projectId: string) => {
    console.log('📊 DB: Getting single project:', projectId);
    const operation = () => supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    return withTimeout(
      withTiming('DB GetProject', operation),
      DB_TIMEOUT,
      'Get project operation timed out'
    );
  },

  getProjects: async (userId: string) => {
    console.log('📊 DB: Getting all projects for user:', userId);
    const operation = () => supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    return withTimeout(
      withTiming('DB GetProjects', operation),
      DB_TIMEOUT,
      'Get projects operation timed out'
    );
  },

  getActiveProjects: async (userId: string) => {
    console.log('📊 DB: Getting active projects for user:', userId);
    const operation = () => supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });
    
    return withTimeout(
      withTiming('DB GetActiveProjects', operation),
      DB_TIMEOUT,
      'Get active projects operation timed out'
    );
  },

  getArchivedProjects: async (userId: string) => {
    console.log('📊 DB: Getting archived projects for user:', userId);
    const operation = () => supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', true)
      .order('updated_at', { ascending: false });
    
    return withTimeout(
      withTiming('DB GetArchivedProjects', operation),
      DB_TIMEOUT,
      'Get archived projects operation timed out'
    );
  },

  createProject: async (project: any) => {
    console.log('📊 DB: Creating project:', project.name);
    const operation = () => supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB CreateProject', operation),
      DB_TIMEOUT,
      'Create project operation timed out'
    );
  },

  updateProject: async (id: string, updates: any) => {
    console.log('📊 DB: Updating project:', id, 'with updates:', Object.keys(updates));
    const operation = () => supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB UpdateProject', operation),
      DB_TIMEOUT,
      'Update project operation timed out'
    );
  },

  archiveProject: async (id: string) => {
    console.log('📊 DB: Archiving project:', id);
    const operation = () => supabase
      .from('projects')
      .update({ is_archived: true })
      .eq('id', id);
    
    return withTimeout(
      withTiming('DB ArchiveProject', operation),
      DB_TIMEOUT,
      'Archive project operation timed out'
    );
  },

  restoreProject: async (id: string) => {
    console.log('📊 DB: Restoring project:', id);
    const operation = () => supabase
      .from('projects')
      .update({ is_archived: false })
      .eq('id', id);
    
    return withTimeout(
      withTiming('DB RestoreProject', operation),
      DB_TIMEOUT,
      'Restore project operation timed out'
    );
  },

  deleteProjectPermanently: async (id: string) => {
    console.log('📊 DB: Permanently deleting project:', id);
    const operation = () => supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    return withTimeout(
      withTiming('DB DeleteProject', operation),
      DB_TIMEOUT,
      'Delete project operation timed out'
    );
  },

  // Workspace Modules
  getWorkspaceModules: async (projectId: string) => {
    console.log('📊 DB: Getting workspace modules for project:', projectId);
    const operation = () => supabase
      .from('workspace_modules')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');
    
    return withTimeout(
      withTiming('DB GetWorkspaceModules', operation),
      DB_TIMEOUT,
      'Get workspace modules operation timed out'
    );
  },

  upsertWorkspaceModule: async (module: any) => {
    console.log('📊 DB: Upserting workspace module:', module.module_type);
    const operation = () => supabase
      .from('workspace_modules')
      .upsert(module)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB UpsertWorkspaceModule', operation),
      DB_TIMEOUT,
      'Upsert workspace module operation timed out'
    );
  },

  deleteWorkspaceModule: async (id: string) => {
    console.log('📊 DB: Deleting workspace module:', id);
    const operation = () => supabase
      .from('workspace_modules')
      .delete()
      .eq('id', id);
    
    return withTimeout(
      withTiming('DB DeleteWorkspaceModule', operation),
      DB_TIMEOUT,
      'Delete workspace module operation timed out'
    );
  },

  // PRDs
  getPRDs: async (projectId: string) => {
    console.log('📊 DB: Getting PRDs for project:', projectId);
    const operation = () => supabase
      .from('prds')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });
    
    return withTimeout(
      withTiming('DB GetPRDs', operation),
      DB_TIMEOUT,
      'Get PRDs operation timed out'
    );
  },

  createPRD: async (prd: any) => {
    console.log('📊 DB: Creating PRD:', prd.title);
    const operation = () => supabase
      .from('prds')
      .insert(prd)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB CreatePRD', operation),
      DB_TIMEOUT,
      'Create PRD operation timed out'
    );
  },

  updatePRD: async (id: string, updates: any) => {
    console.log('📊 DB: Updating PRD:', id);
    const operation = () => supabase
      .from('prds')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB UpdatePRD', operation),
      DB_TIMEOUT,
      'Update PRD operation timed out'
    );
  },

  // Tasks
  getTasks: async (projectId: string) => {
    console.log('📊 DB: Getting tasks for project:', projectId);
    const operation = () => supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('position');
    
    return withTimeout(
      withTiming('DB GetTasks', operation),
      DB_TIMEOUT,
      'Get tasks operation timed out'
    );
  },

  createTask: async (task: any) => {
    console.log('📊 DB: Creating task:', task.title);
    const operation = () => supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB CreateTask', operation),
      DB_TIMEOUT,
      'Create task operation timed out'
    );
  },

  updateTask: async (id: string, updates: any) => {
    console.log('📊 DB: Updating task:', id);
    const operation = () => supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB UpdateTask', operation),
      DB_TIMEOUT,
      'Update task operation timed out'
    );
  },

  deleteTask: async (id: string) => {
    console.log('📊 DB: Deleting task:', id);
    const operation = () => supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    return withTimeout(
      withTiming('DB DeleteTask', operation),
      DB_TIMEOUT,
      'Delete task operation timed out'
    );
  },

  // Prompts
  getPrompts: async (projectId: string) => {
    console.log('📊 DB: Getting prompts for project:', projectId);
    const operation = () => supabase
      .from('prompts')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });
    
    return withTimeout(
      withTiming('DB GetPrompts', operation),
      DB_TIMEOUT,
      'Get prompts operation timed out'
    );
  },

  createPrompt: async (prompt: any) => {
    console.log('📊 DB: Creating prompt:', prompt.name);
    const operation = () => supabase
      .from('prompts')
      .insert(prompt)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB CreatePrompt', operation),
      DB_TIMEOUT,
      'Create prompt operation timed out'
    );
  },

  updatePrompt: async (id: string, updates: any) => {
    console.log('📊 DB: Updating prompt:', id);
    const operation = () => supabase
      .from('prompts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB UpdatePrompt', operation),
      DB_TIMEOUT,
      'Update prompt operation timed out'
    );
  },

  // Scratchpad Notes
  getScratchpadNotes: async (projectId: string) => {
    console.log('📊 DB: Getting scratchpad notes for project:', projectId);
    const operation = () => supabase
      .from('scratchpad_notes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');
    
    return withTimeout(
      withTiming('DB GetScratchpadNotes', operation),
      DB_TIMEOUT,
      'Get scratchpad notes operation timed out'
    );
  },

  createScratchpadNote: async (note: any) => {
    console.log('📊 DB: Creating scratchpad note');
    const operation = () => supabase
      .from('scratchpad_notes')
      .insert(note)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB CreateScratchpadNote', operation),
      DB_TIMEOUT,
      'Create scratchpad note operation timed out'
    );
  },

  updateScratchpadNote: async (id: string, updates: any) => {
    console.log('📊 DB: Updating scratchpad note:', id);
    const operation = () => supabase
      .from('scratchpad_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB UpdateScratchpadNote', operation),
      DB_TIMEOUT,
      'Update scratchpad note operation timed out'
    );
  },

  deleteScratchpadNote: async (id: string) => {
    console.log('📊 DB: Deleting scratchpad note:', id);
    const operation = () => supabase
      .from('scratchpad_notes')
      .delete()
      .eq('id', id);
    
    return withTimeout(
      withTiming('DB DeleteScratchpadNote', operation),
      DB_TIMEOUT,
      'Delete scratchpad note operation timed out'
    );
  },

  // Roadmap Items
  getRoadmapItems: async (projectId: string) => {
    console.log('📊 DB: Getting roadmap items for project:', projectId);
    const operation = () => supabase
      .from('roadmap_items')
      .select('*')
      .eq('project_id', projectId)
      .order('position');
    
    return withTimeout(
      withTiming('DB GetRoadmapItems', operation),
      DB_TIMEOUT,
      'Get roadmap items operation timed out'
    );
  },

  createRoadmapItem: async (item: any) => {
    console.log('📊 DB: Creating roadmap item:', item.title);
    const operation = () => supabase
      .from('roadmap_items')
      .insert(item)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB CreateRoadmapItem', operation),
      DB_TIMEOUT,
      'Create roadmap item operation timed out'
    );
  },

  updateRoadmapItem: async (id: string, updates: any) => {
    console.log('📊 DB: Updating roadmap item:', id);
    const operation = () => supabase
      .from('roadmap_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB UpdateRoadmapItem', operation),
      DB_TIMEOUT,
      'Update roadmap item operation timed out'
    );
  },

  // Secrets
  getSecrets: async (projectId: string) => {
    console.log('📊 DB: Getting secrets for project:', projectId);
    const operation = () => supabase
      .from('secrets')
      .select('id, name, description, category, is_active, created_at, updated_at')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('name');
    
    return withTimeout(
      withTiming('DB GetSecrets', operation),
      DB_TIMEOUT,
      'Get secrets operation timed out'
    );
  },

  createSecret: async (secret: any) => {
    console.log('📊 DB: Creating secret:', secret.name);
    const operation = () => supabase
      .from('secrets')
      .insert(secret)
      .select('id, name, description, category, is_active, created_at, updated_at')
      .single();
    
    return withTimeout(
      withTiming('DB CreateSecret', operation),
      DB_TIMEOUT,
      'Create secret operation timed out'
    );
  },

  updateSecret: async (id: string, updates: any) => {
    console.log('📊 DB: Updating secret:', id);
    const operation = () => supabase
      .from('secrets')
      .update(updates)
      .eq('id', id)
      .select('id, name, description, category, is_active, created_at, updated_at')
      .single();
    
    return withTimeout(
      withTiming('DB UpdateSecret', operation),
      DB_TIMEOUT,
      'Update secret operation timed out'
    );
  },

  // Templates
  getPublicTemplates: async () => {
    console.log('📊 DB: Getting public templates');
    const operation = () => supabase
      .from('templates')
      .select(`
        *,
        template_tags(tag),
        profiles(name, avatar_url)
      `)
      .eq('is_public', true)
      .order('download_count', { ascending: false });
    
    return withTimeout(
      withTiming('DB GetPublicTemplates', operation),
      DB_TIMEOUT,
      'Get public templates operation timed out'
    );
  },

  getUserTemplates: async (userId: string) => {
    console.log('📊 DB: Getting user templates for:', userId);
    const operation = () => supabase
      .from('templates')
      .select(`
        *,
        template_tags(tag)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    return withTimeout(
      withTiming('DB GetUserTemplates', operation),
      DB_TIMEOUT,
      'Get user templates operation timed out'
    );
  },

  createTemplate: async (template: any) => {
    console.log('📊 DB: Creating template:', template.name);
    const operation = () => supabase
      .from('templates')
      .insert(template)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB CreateTemplate', operation),
      DB_TIMEOUT,
      'Create template operation timed out'
    );
  },

  // Generic CRUD operations for backward compatibility
  getModuleData: async (table: string, projectId: string) => {
    console.log('📊 DB: Getting module data from table:', table, 'for project:', projectId);
    const operation = () => supabase
      .from(table)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    return withTimeout(
      withTiming(`DB GetModuleData(${table})`, operation),
      DB_TIMEOUT,
      `Get ${table} data operation timed out`
    );
  },

  createModuleData: async (table: string, data: any) => {
    console.log('📊 DB: Creating module data in table:', table);
    const operation = () => supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    return withTimeout(
      withTiming(`DB CreateModuleData(${table})`, operation),
      DB_TIMEOUT,
      `Create ${table} data operation timed out`
    );
  },

  updateModuleData: async (table: string, id: string, updates: any) => {
    console.log('📊 DB: Updating module data in table:', table, 'id:', id);
    const operation = () => supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return withTimeout(
      withTiming(`DB UpdateModuleData(${table})`, operation),
      DB_TIMEOUT,
      `Update ${table} data operation timed out`
    );
  },

  deleteModuleData: async (table: string, id: string) => {
    console.log('📊 DB: Deleting module data from table:', table, 'id:', id);
    const operation = () => supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    return withTimeout(
      withTiming(`DB DeleteModuleData(${table})`, operation),
      DB_TIMEOUT,
      `Delete ${table} data operation timed out`
    );
  },
};