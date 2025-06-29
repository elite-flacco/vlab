import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useAuthStore } from '../stores/authStore';
import { db } from '../lib/supabase';
import { withTimeout, withTiming } from '../lib/utils';
import { Trash2, AlertCircle, RefreshCw, Palette } from 'lucide-react';
import { ModuleCard } from '../components/Workspace/ModuleCard';
import { ModuleType } from '../types';

interface WorkspaceData {
  prds: any[];
  roadmapItems: any[];
  tasks: any[];
  scratchpadNotes: any[];
  prompts: any[];
  secrets: any[];
}

const ALL_MODULE_TYPES: ModuleType[] = ['prd', 'roadmap', 'tasks', 'scratchpad', 'prompts', 'secrets', 'design'];

export const Workspace: React.FC = () => {
  console.log('🏠 Workspace: Component render started');
  
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Get ALL store values to ensure proper subscription
  const projectStore = useProjectStore();
  const { 
    activeProjects, 
    archivedProjects, 
    currentProject, 
    setCurrentProject, 
    updateWorkspaceLayout, 
    deleteProjectPermanently,
    fetchProjects,
    loading: projectsLoading,
    error: projectsError
  } = projectStore;
  
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData>({
    prds: [],
    roadmapItems: [],
    tasks: [],
    scratchpadNotes: [],
    prompts: [],
    secrets: [],
  });
  const [loading, setLoading] = useState(false);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const maxRetries = 3;

  console.log('🏠 Workspace: Component state:', {
    projectId,
    currentProject: currentProject?.id,
    loading,
    isProjectLoading,
    error,
    retryCount,
    isRetrying,
    activeProjectsCount: activeProjects?.length || 0,
    archivedProjectsCount: archivedProjects?.length || 0,
    projectsLoading,
    userExists: !!user,
    userId: user?.id,
    projectsError
  });

  // Combine active and archived projects
  const allProjects = [...(activeProjects || []), ...(archivedProjects || [])];

  // Fetch projects when user is available and we don't have projects yet
  useEffect(() => {
    if (user && !projectsLoading && activeProjects.length === 0 && archivedProjects.length === 0 && !projectsError) {
      console.log('📊 Workspace: Triggering fetchProjects for user:', user.id);
      fetchProjects(user.id);
    }
  }, [user, projectsLoading, activeProjects.length, archivedProjects.length, projectsError, fetchProjects]);

  // Memoize fetchWorkspaceData to prevent unnecessary re-renders
  const fetchWorkspaceData = useCallback(async (projectId: string, isRetry = false) => {
    console.log('📡 Workspace: fetchWorkspaceData called', {
      projectId,
      isRetry,
      currentLoading: loading,
    });

    // Prevent duplicate fetch attempts by checking loading state
    if (loading && !isRetry) {
      console.log('📡 Workspace: Skipping duplicate fetch attempt (already loading)');
      return;
    }
    
    console.log('🔄 Workspace: Setting loading state to true');
    setLoading(true);
    setError(null);
    
    if (isRetry) {
      console.log('🔄 Workspace: Setting retry state to true');
      setIsRetrying(true);
    }

    try {
      console.log('📡 Workspace: Starting parallel data fetch for all modules');
      
      // Wrap each database call with timeout and timing
      const fetchOperations = [
        withTimeout(
          withTiming('Workspace PRDs', () => db.getPRDs(projectId)),
          10000,
          'PRDs fetch timed out after 10 seconds'
        ),
        withTimeout(
          withTiming('Workspace Roadmap', () => db.getRoadmapItems(projectId)),
          10000,
          'Roadmap items fetch timed out after 10 seconds'
        ),
        withTimeout(
          withTiming('Workspace Tasks', () => db.getTasks(projectId)),
          10000,
          'Tasks fetch timed out after 10 seconds'
        ),
        withTimeout(
          withTiming('Workspace Scratchpad', () => db.getScratchpadNotes(projectId)),
          10000,
          'Scratchpad notes fetch timed out after 10 seconds'
        ),
        withTimeout(
          withTiming('Workspace Prompts', () => db.getPrompts(projectId)),
          10000,
          'Prompts fetch timed out after 10 seconds'
        ),
        withTimeout(
          withTiming('Workspace Secrets', () => db.getSecrets(projectId)),
          10000,
          'Secrets fetch timed out after 10 seconds'
        ),
      ];

      console.log('📡 Workspace: Executing Promise.all for all data fetches');
      const [
        prdsResult,
        roadmapResult,
        tasksResult,
        scratchpadResult,
        promptsResult,
        secretsResult,
      ] = await Promise.all(fetchOperations);

      console.log('📡 Workspace: All fetch operations completed, checking for errors');

      // Check for errors
      if (prdsResult.error) {
        console.error('❌ Workspace: PRDs fetch error:', prdsResult.error);
        throw prdsResult.error;
      }
      if (roadmapResult.error) {
        console.error('❌ Workspace: Roadmap fetch error:', roadmapResult.error);
        throw roadmapResult.error;
      }
      if (tasksResult.error) {
        console.error('❌ Workspace: Tasks fetch error:', tasksResult.error);
        throw tasksResult.error;
      }
      if (scratchpadResult.error) {
        console.error('❌ Workspace: Scratchpad fetch error:', scratchpadResult.error);
        throw scratchpadResult.error;
      }
      if (promptsResult.error) {
        console.error('❌ Workspace: Prompts fetch error:', promptsResult.error);
        throw promptsResult.error;
      }
      if (secretsResult.error) {
        console.error('❌ Workspace: Secrets fetch error:', secretsResult.error);
        throw secretsResult.error;
      }

      const newWorkspaceData = {
        prds: prdsResult.data || [],
        roadmapItems: roadmapResult.data || [],
        tasks: tasksResult.data || [],
        scratchpadNotes: scratchpadResult.data || [],
        prompts: promptsResult.data || [],
        secrets: secretsResult.data || [],
      };

      console.log('✅ Workspace: All data fetched successfully:', {
        prds: newWorkspaceData.prds.length,
        roadmapItems: newWorkspaceData.roadmapItems.length,
        tasks: newWorkspaceData.tasks.length,
        scratchpadNotes: newWorkspaceData.scratchpadNotes.length,
        prompts: newWorkspaceData.prompts.length,
        secrets: newWorkspaceData.secrets.length,
      });

      console.log('🔄 Workspace: Setting workspace data state');
      setWorkspaceData(newWorkspaceData);
      
      // Reset retry count on success
      console.log('🔄 Workspace: Resetting retry count to 0');
      setRetryCount(0);
    } catch (error: any) {
      console.error('❌ Workspace: Error fetching workspace data:', error);
      
      // Handle different types of errors
      let errorMessage = 'Failed to load workspace data';
      
      if (error.message?.includes('timed out')) {
        errorMessage = `Database operation timed out: ${error.message}. This might indicate a slow connection or server issues.`;
        console.error('⏰ Workspace: Timeout error detected');
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMessage = 'Unable to connect to the database. Please check your internet connection and Supabase configuration.';
        console.error('🌐 Workspace: Network error detected');
      } else if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        errorMessage = 'Authentication error. Please try signing in again.';
        console.error('🔐 Workspace: Authentication error detected');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('🔄 Workspace: Setting error state:', errorMessage);
      setError(errorMessage);
      
      // Don't auto-retry on auth errors or after max retries
      if (!error.message?.includes('auth') && retryCount < maxRetries && !isRetry) {
        console.log('🔄 Workspace: Incrementing retry count:', retryCount + 1);
        setRetryCount(prev => prev + 1);
      }
    } finally {
      console.log('🔄 Workspace: Setting loading and retry states to false');
      setLoading(false);
      setIsRetrying(false);
    }
  }, [loading, retryCount, maxRetries]);

  // Handle project selection and data fetching
  useEffect(() => {
    console.log('🔄 Workspace: useEffect[projectId, allProjects, projectsLoading, workspaceData] triggered', {
      projectId,
      allProjectsLength: allProjects.length,
      currentProjectId: currentProject?.id,
      projectsLoading,
      userExists: !!user,
      hasWorkspaceData: Object.values(workspaceData).some(arr => arr.length > 0),
      loading,
      isProjectLoading,
    });

    // Wait for user to be available
    if (!user) {
      console.log('⏳ Workspace: Waiting for user to be available');
      return;
    }

    // If we have a projectId but no currentProject or currentProject doesn't match
    if (projectId && (!currentProject || currentProject.id !== projectId)) {
      console.log('🔍 Workspace: Need to load project:', projectId);
      
      // First check if project exists in already-loaded projects
      const project = allProjects.find(p => p.id === projectId);
      
      if (project) {
        console.log('🔄 Workspace: Found project in loaded projects, setting as current:', project.name);
        setCurrentProject(project);
      } else if (!projectsLoading && allProjects.length > 0) {
        // Projects have been loaded but project not found in list - try fetching it directly
        console.log('🔍 Workspace: Project not found in loaded projects, fetching directly');
        setIsProjectLoading(true);
        
        db.getProject(projectId)
          .then(({ data, error }) => {
            if (error) {
              console.error('❌ Workspace: Error fetching project:', error);
              // Project not found, redirect to dashboard
              navigate('/');
            } else if (data) {
              console.log('✅ Workspace: Project fetched successfully:', data.name);
              setCurrentProject(data);
            } else {
              console.log('❌ Workspace: Project not found, redirecting to dashboard');
              navigate('/');
            }
          })
          .catch((error) => {
            console.error('❌ Workspace: Error fetching project:', error);
            navigate('/');
          })
          .finally(() => {
            setIsProjectLoading(false);
          });
      } else if (!projectsLoading && allProjects.length === 0 && !projectsError) {
        // No projects exist for user - redirect to dashboard
        console.log('❌ Workspace: No projects exist for user, redirecting to dashboard');
        navigate('/');
      }
      // If projectsLoading is true, we wait for projects to load first
    }

    // Once we have a currentProject that matches the URL, fetch workspace data if needed
    if (currentProject && currentProject.id === projectId) {
      const hasWorkspaceData = Object.values(workspaceData).some(arr => arr.length > 0);
      
      if (!hasWorkspaceData && !loading) {
        console.log('📡 Workspace: Triggering fetchWorkspaceData for current project');
        fetchWorkspaceData(projectId);
      } else if (hasWorkspaceData) {
        console.log('📡 Workspace: Workspace data already loaded for current project');
      } else if (loading) {
        console.log('📡 Workspace: Already loading workspace data');
      }
    }
  }, [projectId, allProjects, currentProject, setCurrentProject, fetchWorkspaceData, navigate, projectsLoading, user, projectsError, workspaceData, loading]);

  const handleAddMissingModules = async () => {
    console.log('➕ Workspace: handleAddMissingModules called');
    if (!currentProject) {
      console.log('❌ Workspace: No current project, cannot add modules');
      return;
    }

    const defaultModules = ALL_MODULE_TYPES.map(type => ({
      id: `${type}-1`, // Simple ID for now, ideally UUID
      type: type,
      position: { x: 0, y: 0 }, // Position will be handled by grid layout
      size: { width: 1, height: 1 }, // Size will be handled by grid layout
      data: {},
      is_visible: true,
    }));

    const existingModuleTypes = new Set(currentProject.workspace_layout.modules.map(m => m.type));
    const missingModules = defaultModules.filter(module => !existingModuleTypes.has(module.type));

    console.log('➕ Workspace: Missing modules:', missingModules.map(m => m.type));

    if (missingModules.length > 0) {
      const updatedLayout = {
        ...currentProject.workspace_layout,
        modules: [...currentProject.workspace_layout.modules, ...missingModules],
        grid_config: {
          ...currentProject.workspace_layout.grid_config,
          // Ensure enough rows/columns if needed, though for cards it's less critical
          columns: 3, // Example: 3 columns for cards
          rows: Math.ceil((currentProject.workspace_layout.modules.length + missingModules.length) / 3),
        },
      };

      console.log('🔄 Workspace: Updating workspace layout');
      await updateWorkspaceLayout(updatedLayout);
      if (projectId) {
        console.log('📡 Workspace: Refetching workspace data after adding modules');
        await fetchWorkspaceData(projectId, true);
      }
    }
  };

  const handleDeleteProject = async () => {
    console.log('🗑️ Workspace: handleDeleteProject called');
    if (!currentProject || isDeleting) {
      console.log('❌ Workspace: Cannot delete - no project or already deleting');
      return;
    }

    console.log('🔄 Workspace: Setting deleting state to true');
    setIsDeleting(true);
    try {
      console.log('🗑️ Workspace: Calling deleteProjectPermanently for:', currentProject.id);
      await deleteProjectPermanently(currentProject.id);
      // Navigate back to dashboard after successful deletion
      console.log('🧭 Workspace: Navigating to dashboard after deletion');
      navigate('/');
    } catch (error) {
      console.error('❌ Workspace: Failed to delete project:', error);
      // Error handling is managed by the store
    } finally {
      console.log('🔄 Workspace: Setting deleting and confirm states to false');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRetry = () => {
    console.log('🔄 Workspace: handleRetry called');
    if (projectId) {
      console.log('🔄 Workspace: Resetting retry count and triggering fetchWorkspaceData');
      setRetryCount(0);
      fetchWorkspaceData(projectId, true);
    }
  };

  const getModuleSummary = (type: ModuleType): string => {
    switch (type) {
      case 'prd':
        const latestPRD = workspaceData.prds[0];
        return latestPRD ? `Latest: ${latestPRD.title} (v${latestPRD.version})` : 'No Product Requirements Documents yet.';
      case 'roadmap':
        const completedRoadmapItems = workspaceData.roadmapItems.filter(item => item.status === 'completed').length;
        return `${workspaceData.roadmapItems.length} phases, ${completedRoadmapItems} completed.`;
      case 'tasks':
        const todoTasks = workspaceData.tasks.filter(task => task.status === 'todo').length;
        const inProgressTasks = workspaceData.tasks.filter(task => task.status === 'in_progress').length;
        return `${workspaceData.tasks.length} tasks total, ${todoTasks} to do, ${inProgressTasks} in progress.`;
      case 'scratchpad':
        return `${workspaceData.scratchpadNotes.length} notes.`;
      case 'prompts':
        return `${workspaceData.prompts.length} prompts.`;
      case 'secrets':
        const activeSecrets = workspaceData.secrets.filter(secret => secret.is_active).length;
        return `${workspaceData.secrets.length} secrets, ${activeSecrets} active.`;
      case 'design':
        return 'AI-powered design assistant. Coming soon!';
      default:
        return 'No data available.';
    }
  };

  // Show loading if projects are loading OR we're loading a specific project OR workspace data is loading
  if (projectsLoading || isProjectLoading || loading) {
    console.log('⏳ Workspace: Rendering loading state', { projectsLoading, isProjectLoading, loading });
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground-dim font-mono">
            {currentProject ? `Loading ${currentProject.name}...` : 'Loading workspace...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || projectsError) {
    const displayError = error || projectsError;
    console.log('❌ Workspace: Rendering error state:', displayError);
    return (
      <div className="bg-secondary/50 border border-border rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-error mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-error mb-2 font-mono">Error Loading Workspace</h3>
            <p className="text-error/90 mb-4">{displayError}</p>
            
            {displayError?.includes('connection') && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-error/90 mb-2 font-mono">Connection Troubleshooting:</h4>
                <ul className="text-sm text-foreground-dim space-y-1">
                  <li>• Check your internet connection</li>
                  <li>• Verify you're logged in</li>
                  <li>• Try refreshing the page</li>
                  <li>• Contact support if the issue persists</li>
                </ul>
              </div>
            )}
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="px-4 py-2 bg-error/90 hover:bg-error text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isRetrying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-ghost"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Always render workspace content if we have a projectId, even without currentProject or data
  if (!projectId) {
    console.log('❌ Workspace: No projectId in URL, redirecting to dashboard');
    navigate('/');
    return null;
  }

  console.log('✅ Workspace: Rendering main workspace content');
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground font-mono">
            {currentProject?.name || 'Workspace'}
          </h1>
          {currentProject?.description && (
            <p className="text-foreground-dim text-sm">{currentProject.description}</p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-danger"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Project
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && currentProject && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md scale-in">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="modal-title">Delete Project</h2>
              </div>
              
              <div className="mb-6">
                <p className="text-foreground-dim mb-3">
                  Are you sure you want to delete <strong className="text-foreground">"{currentProject.name}"</strong>?
                </p>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-red-400">
                    <strong>Warning:</strong> This action cannot be undone. All project data including PRDs, tasks, roadmaps, notes, prompts, and secrets will be permanently deleted.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                  }}
                  disabled={isDeleting}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                  className="btn-danger flex-1"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span>Delete Project</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module Cards Grid */}
      <div className="workspace-grid">
        {ALL_MODULE_TYPES.map((type) => {
          console.log('🎯 Workspace: Rendering module card for:', type);
          
          // Special handling for design module
          if (type === 'design') {
            return (
              <button 
                key={type} 
                onClick={() => navigate(`/workspace/${projectId}/${type}`)}
                className="module-card relative overflow-hidden group"
              >
                <div className="card-header">
                  <Palette className="module-icon" />
                </div>
                <h3 className="module-title">Design</h3>
                <p className="module-summary">AI-powered design assistant. Coming soon!</p>
                
                {/* Coming Soon Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/30">
                    <span className="text-primary font-semibold">Coming Soon</span>
                  </div>
                </div>
              </button>
            );
          }
          
          return (
            <ModuleCard
              key={type}
              title={type.charAt(0).toUpperCase() + type.slice(1)}
              type={type}
              summary={getModuleSummary(type)}
              onClick={() => {
                console.log('🧭 Workspace: Navigating to module:', type);
                navigate(`/workspace/${projectId}/${type}`);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};