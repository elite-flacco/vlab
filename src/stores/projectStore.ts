import { create } from "zustand";
import { Project, WorkspaceLayout } from "../types";
import { db } from "../lib/supabase";

interface ProjectState {
  activeProjects: Project[];
  archivedProjects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  fetchProjects: (userId: string) => Promise<void>;
  createProject: (
    name: string,
    userId: string,
    description?: string,
  ) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  deleteProjectPermanently: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  updateWorkspaceLayout: (layout: WorkspaceLayout) => Promise<void>;
  clearProjects: () => void;
  clearError: () => void;
}

const defaultWorkspaceLayout: WorkspaceLayout = {
  modules: [
    {
      id: "prd-1",
      type: "prd",
      position: { x: 0, y: 0 },
      size: { width: 6, height: 3 },
      data: {},
      is_visible: true,
    },
    {
      id: "roadmap-1",
      type: "roadmap",
      position: { x: 6, y: 0 },
      size: { width: 6, height: 3 },
      data: {},
      is_visible: true,
    },
    {
      id: "tasks-1",
      type: "tasks",
      position: { x: 0, y: 3 },
      size: { width: 6, height: 3 },
      data: {},
      is_visible: true,
    },
    {
      id: "deployment-1",
      type: "deployment",
      position: { x: 6, y: 3 },
      size: { width: 6, height: 3 },
      data: {},
      is_visible: true,
    },
    {
      id: "scratchpad-1",
      type: "scratchpad",
      position: { x: 0, y: 6 },
      size: { width: 12, height: 2 },
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
    set({ loading: true, error: null });

    try {
      const [activeResult, archivedResult] = await Promise.all([
        db.getActiveProjects(userId),
        db.getArchivedProjects(userId),
      ]);

      const activeRes = activeResult as { data: any[] | null; error: any };
      const archivedRes = archivedResult as { data: any[] | null; error: any };

      if (activeRes.error) {
        console.error(
          "❌ ProjectStore: Active projects fetch error:",
          activeRes.error,
        );
        throw activeRes.error;
      }
      if (archivedRes.error) {
        console.error(
          "❌ ProjectStore: Archived projects fetch error:",
          archivedRes.error,
        );
        throw archivedRes.error;
      }

      const activeProjects = activeRes.data || [];
      const archivedProjects = archivedRes.data || [];

      set({
        activeProjects,
        archivedProjects,
        loading: false,
      });
    } catch (error: Error | unknown) {
      console.error("❌ ProjectStore: fetchProjects error:", error);
      set({
        error: error instanceof Error ? error.message : String(error),
        loading: false,
      });
    }
  },

  createProject: async (name: string, userId: string, description?: string) => {
    set({ loading: true, error: null });
    try {
      const projectData = {
        name,
        description,
        user_id: userId,
        workspace_layout: defaultWorkspaceLayout,
      };
      const result = await db.createProject(projectData) as { data: any; error: any };
      if (result.error) throw result.error;

      const { activeProjects } = get();
      set({
        activeProjects: [result.data, ...activeProjects],
        currentProject: result.data,
        loading: false,
      });

      return result.data;
    } catch (error: Error | unknown) {
      console.error("❌ ProjectStore: Create project error:", error);
      set({
        error: error instanceof Error ? error.message : String(error),
        loading: false,
      });
      throw error;
    }
  },

  updateProject: async (id: string, updates: Partial<Project>) => {
    set({ loading: true, error: null });
    try {
      const result = await db.updateProject(id, updates) as { data: any; error: any };
      if (result.error) throw result.error;

      const { activeProjects, archivedProjects, currentProject } = get();
      const updatedActiveProjects = activeProjects.map((p) =>
        p.id === id ? result.data : p,
      );
      const updatedArchivedProjects = archivedProjects.map((p) =>
        p.id === id ? result.data : p,
      );

      set({
        activeProjects: updatedActiveProjects,
        archivedProjects: updatedArchivedProjects,
        currentProject: currentProject?.id === id ? result.data : currentProject,
        loading: false,
      });
    } catch (error: Error | unknown) {
      set({
        error: error instanceof Error ? error.message : String(error),
        loading: false,
      });
    }
  },

  archiveProject: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const result = await db.archiveProject(id) as { error: any };
      if (result.error) throw result.error;

      const { activeProjects, archivedProjects, currentProject } = get();
      const projectToArchive = activeProjects.find((p) => p.id === id);

      if (projectToArchive) {
        const archivedProject = { ...projectToArchive, is_archived: true };
        set({
          activeProjects: activeProjects.filter((p) => p.id !== id),
          archivedProjects: [archivedProject, ...archivedProjects],
          currentProject: currentProject?.id === id ? null : currentProject,
          loading: false,
        });
      }
    } catch (error: Error | unknown) {
      set({
        error: error instanceof Error ? error.message : String(error),
        loading: false,
      });
    }
  },

  restoreProject: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const result = await db.restoreProject(id) as { error: any };
      if (result.error) throw result.error;

      const { activeProjects, archivedProjects } = get();
      const projectToRestore = archivedProjects.find((p) => p.id === id);

      if (projectToRestore) {
        const restoredProject = { ...projectToRestore, is_archived: false };
        set({
          activeProjects: [restoredProject, ...activeProjects],
          archivedProjects: archivedProjects.filter((p) => p.id !== id),
          loading: false,
        });
      }
    } catch (error: Error | unknown) {
      set({
        error: error instanceof Error ? error.message : String(error),
        loading: false,
      });
    }
  },

  deleteProjectPermanently: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const result = await db.deleteProjectPermanently(id) as { error: any };
      if (result.error) throw result.error;

      const { activeProjects, archivedProjects, currentProject } = get();

      set({
        activeProjects: activeProjects.filter((p) => p.id !== id),
        archivedProjects: archivedProjects.filter((p) => p.id !== id),
        currentProject: currentProject?.id === id ? null : currentProject,
        loading: false,
      });
    } catch (error: Error | unknown) {
      set({
        error: error instanceof Error ? error.message : String(error),
        loading: false,
      });
    }
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },

  updateWorkspaceLayout: async (layout: WorkspaceLayout) => {
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      await get().updateProject(currentProject.id, {
        workspace_layout: layout,
      });
    } catch (error: Error | unknown) {
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  clearProjects: () => {
    set({
      activeProjects: [],
      archivedProjects: [],
      currentProject: null,
      loading: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
