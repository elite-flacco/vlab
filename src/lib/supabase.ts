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

  signInAnonymously: async () => {
    const operation = () => supabase.auth.signInAnonymously({
      options: {
        data: {
          is_anonymous: true,
          name: 'Guest User'
        }
      }
    });
    
    return withTimeout(
      withTiming('Auth SignInAnonymously', operation),
      DB_TIMEOUT,
      'Anonymous sign in operation timed out'
    );
  },

  claimAnonymousAccount: async (email: string, password: string, name: string) => {
    // For anonymous account claiming, we need to:
    // 1. Create a new proper account
    // 2. Transfer the data from anonymous to new account
    // 3. Delete the anonymous account
    
    const operation = async () => {
      // First, get the current anonymous user
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('No anonymous user found');
      }
      
      const anonymousUserId = currentUser.user.id;
      
      // Sign out the anonymous user
      await supabase.auth.signOut();
      
      // Create a new proper account
      const { data: newUserData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            claimed_from_anonymous: anonymousUserId, // Track where this came from
          }
        }
      });
      
      if (signUpError) {
        throw signUpError;
      }
      
      return { data: newUserData, error: null };
    };
    
    return withTimeout(
      withTiming('Auth ClaimAnonymousAccount', operation),
      DB_TIMEOUT,
      'Claim anonymous account operation timed out'
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
    const operation = () => supabase
      .from('prds')
      .select(`
        *,
        created_by_profile:created_by(name, email),
        updated_by_profile:updated_by(name, email)
      `)
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });
    
    return withTimeout(
      withTiming('DB GetPRDs', operation),
      DB_TIMEOUT,
      'Get PRDs operation timed out'
    );
  },

  createPRD: async (prd: any) => {
    const operation = () => supabase
      .from('prds')
      .insert(prd)
      .select(`
        *,
        created_by_profile:created_by(name, email),
        updated_by_profile:updated_by(name, email)
      `)
      .single();
    
    return withTimeout(
      withTiming('DB CreatePRD', operation),
      DB_TIMEOUT,
      'Create PRD operation timed out'
    );
  },

  updatePRD: async (id: string, updates: any) => {
    const operation = () => supabase
      .from('prds')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        created_by_profile:created_by(name, email),
        updated_by_profile:updated_by(name, email)
      `)
      .single();
    
    return withTimeout(
      withTiming('DB UpdatePRD', operation),
      DB_TIMEOUT,
      'Update PRD operation timed out'
    );
  },

  // PRD Versions
  getPRDVersions: async (prdId: string) => {
    const operation = () => supabase
      .from('prd_versions')
      .select(`
        *,
        created_by_profile:created_by(name, email)
      `)
      .eq('prd_id', prdId)
      .order('version_number', { ascending: false });
    
    return withTimeout(
      withTiming('DB GetPRDVersions', operation),
      DB_TIMEOUT,
      'Get PRD versions operation timed out'
    );
  },

  getSpecificPRDVersion: async (prdId: string, versionNumber: number) => {
    
    // First get the current PRD to check if this is the current version
    const currentPRDResult = await supabase
      .from('prds')
      .select(`
        *,
        created_by_profile:created_by(name, email),
        updated_by_profile:updated_by(name, email)
      `)
      .eq('id', prdId)
      .single();
    
    if (currentPRDResult.error) throw currentPRDResult.error;
    
    // If requesting the current version, return the current PRD data
    if (versionNumber === currentPRDResult.data.version) {
      return {
        ...currentPRDResult.data,
        version_number: currentPRDResult.data.version,
        is_current: true
      };
    }
    
    // Otherwise, fetch from prd_versions table
    const operation = () => supabase
      .from('prd_versions')
      .select(`
        *,
        created_by_profile:created_by(name, email)
      `)
      .eq('prd_id', prdId)
      .eq('version_number', versionNumber)
      .single();
    
    const result = await withTimeout(
      withTiming('DB GetSpecificPRDVersion', operation),
      DB_TIMEOUT,
      'Get specific PRD version operation timed out'
    );
    
    if (result.error) throw result.error;
    
    return {
      ...result.data,
      is_current: false
    };
  },

  getPRDVersionComparison: async (prdId: string, versionA: number, versionB: number) => {
    const operation = () => supabase
      .rpc('get_prd_version_comparison', {
        prd_uuid: prdId,
        version_a: versionA,
        version_b: versionB
      });
    
    return withTimeout(
      withTiming('DB GetPRDVersionComparison', operation),
      DB_TIMEOUT,
      'Get PRD version comparison operation timed out'
    );
  },

  restorePRDVersion: async (prdId: string, versionNumber: number, changeDescription?: string) => {
    
    // First get the version data
    const versionResult = await supabase
      .from('prd_versions')
      .select('title, content')
      .eq('prd_id', prdId)
      .eq('version_number', versionNumber)
      .single();
    
    if (versionResult.error) throw versionResult.error;
    
    // Then update the current PRD with the version data
    const operation = () => supabase
      .from('prds')
      .update({
        title: versionResult.data.title,
        content: versionResult.data.content,
        change_description: changeDescription || `Restored to version ${versionNumber}`
      })
      .eq('id', prdId)
      .select(`
        *,
        created_by_profile:created_by(name, email),
        updated_by_profile:updated_by(name, email)
      `)
      .single();
    
    return withTimeout(
      withTiming('DB RestorePRDVersion', operation),
      DB_TIMEOUT,
      'Restore PRD version operation timed out'
    );
  },

  // Tasks
  getTasks: async (projectId: string) => {
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

  deletePrompt: async (id: string) => {
    const operation = () => supabase
      .from('prompts')
      .delete()
      .eq('id', id);
    
    return withTimeout(
      withTiming('DB DeletePrompt', operation),
      DB_TIMEOUT,
      'Delete prompt operation timed out'
    );
  },

  // Scratchpad Notes
  getScratchpadNotes: async (projectId: string) => {
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

  // Global Notes (project-agnostic)
  getGlobalNotes: async (userId: string) => {
    const operation = () => supabase
      .from('global_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');
    
    return withTimeout(
      withTiming('DB GetGlobalNotes', operation),
      DB_TIMEOUT,
      'Get global notes operation timed out'
    );
  },

  createGlobalNote: async (note: any) => {
    const operation = () => supabase
      .from('global_notes')
      .insert(note)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB CreateGlobalNote', operation),
      DB_TIMEOUT,
      'Create global note operation timed out'
    );
  },

  updateGlobalNote: async (id: string, updates: any) => {
    const operation = () => supabase
      .from('global_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB UpdateGlobalNote', operation),
      DB_TIMEOUT,
      'Update global note operation timed out'
    );
  },

  deleteGlobalNote: async (id: string) => {
    const operation = () => supabase
      .from('global_notes')
      .delete()
      .eq('id', id);
    
    return withTimeout(
      withTiming('DB DeleteGlobalNote', operation),
      DB_TIMEOUT,
      'Delete global note operation timed out'
    );
  },

  // Roadmap Items
  getRoadmapItems: async (projectId: string) => {
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

  // Deployment Items
  getDeploymentItems: async (projectId: string) => {
    const operation = () => supabase
      .from('deployment_items')
      .select('*')
      .eq('project_id', projectId)
      .order('position');
    
    return withTimeout(
      withTiming('DB GetDeploymentItems', operation),
      DB_TIMEOUT,
      'Get deployment items operation timed out'
    );
  },

  createDeploymentItem: async (item: any) => {
    const operation = () => supabase
      .from('deployment_items')
      .insert(item)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB CreateDeploymentItem', operation),
      DB_TIMEOUT,
      'Create deployment item operation timed out'
    );
  },

  updateDeploymentItem: async (id: string, updates: any) => {
    const operation = () => supabase
      .from('deployment_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB UpdateDeploymentItem', operation),
      DB_TIMEOUT,
      'Update deployment item operation timed out'
    );
  },

  deleteDeploymentItem: async (id: string) => {
    const operation = () => supabase
      .from('deployment_items')
      .delete()
      .eq('id', id);
    
    return withTimeout(
      withTiming('DB DeleteDeploymentItem', operation),
      DB_TIMEOUT,
      'Delete deployment item operation timed out'
    );
  },

  // GitHub Integration
  getGitHubRepositories: async (projectId: string) => {
    const operation = () => supabase
      .from('github_repositories')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });
    
    return withTimeout(
      withTiming('DB GetGitHubRepositories', operation),
      DB_TIMEOUT,
      'Get GitHub repositories operation timed out'
    );
  },

  createGitHubRepository: async (repository: any) => {
    const operation = () => supabase
      .from('github_repositories')
      .upsert(repository, {
        onConflict: 'project_id,repo_full_name',
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB CreateGitHubRepository', operation),
      DB_TIMEOUT,
      'Create GitHub repository operation timed out'
    );
  },

  updateGitHubRepository: async (id: string, updates: any) => {
    const operation = () => supabase
      .from('github_repositories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return withTimeout(
      withTiming('DB UpdateGitHubRepository', operation),
      DB_TIMEOUT,
      'Update GitHub repository operation timed out'
    );
  },

  deleteGitHubRepository: async (id: string) => {
    const operation = () => supabase
      .from('github_repositories')
      .update({ is_active: false })
      .eq('id', id);
    
    return withTimeout(
      withTiming('DB DeleteGitHubRepository', operation),
      DB_TIMEOUT,
      'Delete GitHub repository operation timed out'
    );
  },

  deleteAllUserGitHubRepositories: async (userId: string) => {
    const operation = () => supabase
      .from('github_repositories')
      .delete()
      .eq('user_id', userId);
    
    return withTimeout(
      withTiming('DB DeleteAllUserGitHubRepositories', operation),
      DB_TIMEOUT,
      'Delete all user GitHub repositories operation timed out'
    );
  },

  getGitHubToken: async (userId: string) => {
    const operation = () => supabase
      .from('github_tokens')
      .select('id, token_scope, github_username, github_user_id, expires_at, is_active, created_at, updated_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    return withTimeout(
      withTiming('DB GetGitHubToken', operation),
      DB_TIMEOUT,
      'Get GitHub token operation timed out'
    );
  },

  getGitHubTokenWithSecret: async (userId: string) => {
    const operation = () => supabase
      .from('github_tokens')
      .select('id, encrypted_token, token_scope, github_username, github_user_id, expires_at, is_active, created_at, updated_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    return withTimeout(
      withTiming('DB GetGitHubTokenWithSecret', operation),
      DB_TIMEOUT,
      'Get GitHub token with secret operation timed out'
    );
  },

  createGitHubToken: async (token: any) => {
    const operation = () => supabase
      .from('github_tokens')
      .insert(token)
      .select('id, token_scope, github_username, github_user_id, expires_at, is_active, created_at, updated_at')
      .single();
    
    return withTimeout(
      withTiming('DB CreateGitHubToken', operation),
      DB_TIMEOUT,
      'Create GitHub token operation timed out'
    );
  },

  updateGitHubToken: async (id: string, updates: any) => {
    const operation = () => supabase
      .from('github_tokens')
      .update(updates)
      .eq('id', id)
      .select('id, token_scope, github_username, github_user_id, expires_at, is_active, created_at, updated_at')
      .single();
    
    return withTimeout(
      withTiming('DB UpdateGitHubToken', operation),
      DB_TIMEOUT,
      'Update GitHub token operation timed out'
    );
  },

  revokeGitHubToken: async (userId: string) => {
    const operation = () => supabase
      .from('github_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('is_active', true);
    
    return withTimeout(
      withTiming('DB RevokeGitHubToken', operation),
      DB_TIMEOUT,
      'Revoke GitHub token operation timed out'
    );
  },

  getGitHubIssues: async (projectId: string) => {
    const operation = () => supabase
      .from('github_issues')
      .select(`
        *,
        task:tasks(*),
        repository:github_repositories(*)
      `)
      .eq('repository.project_id', projectId)
      .order('updated_at', { ascending: false });
    
    return withTimeout(
      withTiming('DB GetGitHubIssues', operation),
      DB_TIMEOUT,
      'Get GitHub issues operation timed out'
    );
  },

  getGitHubIssueByTask: async (taskId: string) => {
    const operation = () => supabase
      .from('github_issues')
      .select(`
        *,
        repository:github_repositories(*)
      `)
      .eq('task_id', taskId)
      .maybeSingle();
    
    return withTimeout(
      withTiming('DB GetGitHubIssueByTask', operation),
      DB_TIMEOUT,
      'Get GitHub issue by task operation timed out'
    );
  },

  createGitHubIssue: async (issue: any) => {
    const operation = () => supabase
      .from('github_issues')
      .insert(issue)
      .select(`
        *,
        repository:github_repositories(*)
      `)
      .single();
    
    return withTimeout(
      withTiming('DB CreateGitHubIssue', operation),
      DB_TIMEOUT,
      'Create GitHub issue operation timed out'
    );
  },

  updateGitHubIssue: async (id: string, updates: any) => {
    const operation = () => supabase
      .from('github_issues')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        repository:github_repositories(*)
      `)
      .single();
    
    return withTimeout(
      withTiming('DB UpdateGitHubIssue', operation),
      DB_TIMEOUT,
      'Update GitHub issue operation timed out'
    );
  },
};