import { create } from 'zustand';
import { Project, WorkspaceLayout } from '../types';
import { db } from '../lib/supabase';

interface ProjectState {
  activeProjects: Project[];
  archivedProjects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  fetchProjects: (userId: string) => Promise<void>;
  createProject: (name: string, userId: string, description?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  deleteProjectPermanently: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  updateWorkspaceLayout: (layout: WorkspaceLayout) => Promise<void>;
  clearError: () => void;
}

const defaultWorkspaceLayout: WorkspaceLayout = {
  modules: [
    {
      id: 'prd-1',
      type: 'prd',
      position: { x: 0, y: 0 },
      size: { width: 6, height: 4 },
      data: {},
      is_visible: true,
    },
    {
      id: 'roadmap-1',
      type: 'roadmap',
      position: { x: 6, y: 0 },
      size: { width: 6, height: 4 },
      data: {},
      is_visible: true,
    },
    {
      id: 'tasks-1',
      type: 'tasks',
      position: { x: 0, y: 4 },
      size: { width: 6, height: 4 },
      data: {},
      is_visible: true,
    },
    {
      id: 'scratchpad-1',
      type: 'scratchpad',
      position: { x: 6, y: 4 },
      size: { width: 6, height: 4 },
      data: {},
      is_visible: true,
    },
  ],
  grid_config: {
    columns: 12,
    rows: 8,
    gap: 16,
  },
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  activeProjects: [],
  archivedProjects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async (userId: string) => {
    console.log('📊 ProjectStore: fetchProjects called with userId:', userId);
    set({ loading: true, error: null });
    
    try {
      console.log('📊 ProjectStore: Starting parallel fetch for active and archived projects');
      
      const [activeResult, archivedResult] = await Promise.all([
        db.getActiveProjects(userId),
        db.getArchivedProjects(userId),
      ]);

      if (activeResult.error) {
        console.error('❌ ProjectStore: Active projects fetch error:', activeResult.error);
        throw activeResult.error;
      }
      if (archivedResult.error) {
        console.error('❌ ProjectStore: Archived projects fetch error:', archivedResult.error);
        throw archivedResult.error;
      }

      const activeProjects = activeResult.data || [];
      const archivedProjects = archivedResult.data || [];
      
      console.log('📊 ProjectStore: Setting projects in store:', {
        activeCount: activeProjects.length,
        archivedCount: archivedProjects.length,
        activeProjects: activeProjects.map(p => ({ id: p.id, name: p.name })),
        archivedProjects: archivedProjects.map(p => ({ id: p.id, name: p.name }))
      });

      set({ 
        activeProjects,
        archivedProjects,
        loading: false 
      });
      
    } catch (error: any) {
      console.error('❌ ProjectStore: fetchProjects error:', error);
      set({ error: error.message, loading: false });
    }
  },

  createProject: async (name: string, userId: string, description?: string) => {
    console.log('📊 ProjectStore: Creating project:', { name, userId, description });
    set({ loading: true, error: null });
    try {
      const projectData = {
        name,
        description,
        user_id: userId,
        workspace_layout: defaultWorkspaceLayout,
      };
      const { data, error } = await db.createProject(projectData);
      if (error) throw error;
      
      const { activeProjects } = get();
      console.log('📊 ProjectStore: Project created successfully:', data);
      set({ 
        activeProjects: [data, ...activeProjects],
        currentProject: data,
        loading: false 
      });
      
      return data;
    } catch (error: any) {
      console.error('❌ ProjectStore: Create project error:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateProject: async (id: string, updates: Partial<Project>) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await db.updateProject(id, updates);
      if (error) throw error;
      
      const { activeProjects, archivedProjects, currentProject } = get();
      const updatedActiveProjects = activeProjects.map(p => p.id === id ? data : p);
      const updatedArchivedProjects = archivedProjects.map(p => p.id === id ? data : p);
      
      set({ 
        activeProjects: updatedActiveProjects,
        archivedProjects: updatedArchivedProjects,
        currentProject: currentProject?.id === id ? data : currentProject,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  archiveProject: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await db.archiveProject(id);
      if (error) throw error;
      
      const { activeProjects, archivedProjects, currentProject } = get();
      const projectToArchive = activeProjects.find(p => p.id === id);
      
      if (projectToArchive) {
        const archivedProject = { ...projectToArchive, is_archived: true };
        set({ 
          activeProjects: activeProjects.filter(p => p.id !== id),
          archivedProjects: [archivedProject, ...archivedProjects],
          currentProject: currentProject?.id === id ? null : currentProject,
          loading: false 
        });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  restoreProject: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await db.restoreProject(id);
      if (error) throw error;
      
      const { activeProjects, archivedProjects } = get();
      const projectToRestore = archivedProjects.find(p => p.id === id);
      
      if (projectToRestore) {
        const restoredProject = { ...projectToRestore, is_archived: false };
        set({ 
          activeProjects: [restoredProject, ...activeProjects],
          archivedProjects: archivedProjects.filter(p => p.id !== id),
          loading: false 
        });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteProjectPermanently: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await db.deleteProjectPermanently(id);
      if (error) throw error;
      
      const { activeProjects, archivedProjects, currentProject } = get();
      
      set({ 
        activeProjects: activeProjects.filter(p => p.id !== id),
        archivedProjects: archivedProjects.filter(p => p.id !== id),
        currentProject: currentProject?.id === id ? null : currentProject,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  setCurrentProject: (project: Project | null) => {
    console.log('📊 ProjectStore: setCurrentProject called with:', project ? { id: project.id, name: project.name } : null);
    set({ currentProject: project });
  },

  updateWorkspaceLayout: async (layout: WorkspaceLayout) => {
    const { currentProject } = get();
    if (!currentProject) return;
    
    try {
      await get().updateProject(currentProject.id, { workspace_layout: layout });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  clearError: () => set({ error: null }),
}));