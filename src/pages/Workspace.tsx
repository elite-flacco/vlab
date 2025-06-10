import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useAuthStore } from '../stores/authStore';
import { db } from '../lib/supabase';
import { withTimeout, withTiming } from '../lib/utils';
import { Plus, Grid3X3, Settings, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
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

const ALL_MODULE_TYPES: ModuleType[] = ['prd', 'roadmap', 'tasks', 'scratchpad', 'prompts', 'secrets'];

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
    // Wait for projects to be loaded and user to be available
    if (projectId && allProjects.length > 0 && !projectsLoading && user) {
      const project = allProjects.find(p => p.id === projectId);
      console.log('🔍 Workspace: Looking for project:', projectId, 'found:', !!project);
      
      if (project) {
        // Only set current project if it's different from the current one
        if (!currentProject || currentProject.id !== project.id) {
          console.log('🔄 Workspace: Setting current project:', project.name);
          setCurrentProject(project);
        }
        
        // Only fetch data if we haven't already loaded data for this project AND we're not currently loading
        const hasWorkspaceData = Object.values(workspaceData).some(arr => arr.length > 0);
        console.log('🔄 Workspace: workspaceData:', workspaceData);
        console.log('🔄 Workspace: hasWorkspaceData:', hasWorkspaceData);
        console.log('🔄 Workspace: loading:', loading);
        if (!hasWorkspaceData && !loading) {
          console.log('📡 Workspace: Triggering fetchWorkspaceData');
          fetchWorkspaceData(projectId);
        } else if (hasWorkspaceData) {
          console.log('📡 Workspace: Workspace data already loaded, skipping fetch');
        } else if (loading) {
          console.log('📡 Workspace: Already loading workspace data, skipping fetch');
        }
      } else {
        // Project not found, redirect to dashboard
        console.log('❌ Workspace: Project not found, redirecting to dashboard');
        navigate('/');
      }
    } else if (projectId && !projectsLoading && allProjects.length === 0 && user && !projectsError) {
      // Projects have been loaded but none exist - redirect to dashboard
      console.log('❌ Workspace: No projects exist for user, redirecting to dashboard');
      navigate('/');
    } else {
      console.log('⏳ Workspace: Waiting for conditions to be met:', {
        hasProjectId: !!projectId,
        hasProjects: allProjects.length > 0,
        projectsNotLoading: !projectsLoading,
        hasUser: !!user,
        noProjectsError: !projectsError
      });
    }
  }, [projectId, allProjects, currentProject, setCurrentProject, fetchWorkspaceData, navigate, projectsLoading, user, projectsError, workspaceData, loading]);

  // // Handle navigation when currentProject changes from sidebar
  // useEffect(() => {
  //   console.log('🔄 Workspace: useEffect[currentProject, projectId] triggered', {
  //     currentProjectId: currentProject?.id,
  //     urlProjectId: projectId,
  //   });

  //   if (currentProject && currentProject.id !== projectId) {
  //     console.log('🧭 Workspace: Navigating to different project:', currentProject.id);
  //     navigate(`/workspace/${currentProject.id}`);
  //   }
  // }, [currentProject, projectId, navigate]);

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
        const latestNote = workspaceData.scratchpadNotes[0];
        return latestNote ? `Latest note: "${latestNote.content.substring(0, 50)}..."` : 'No scratchpad notes yet.';
      case 'prompts':
        return `${workspaceData.prompts.length} AI prompts available.`;
      case 'secrets':
        const activeSecrets = workspaceData.secrets.filter(secret => secret.is_active).length;
        return `${workspaceData.secrets.length} secrets, ${activeSecrets} active.`;
      default:
        return 'No data available.';
    }
  };

  // Show loading if either projects are loading OR workspace data is loading
  if (projectsLoading || loading) {
    console.log('⏳ Workspace: Rendering loading state', { projectsLoading, loading });
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isRetrying ? 'Retrying connection...' : 
             projectsLoading ? 'Loading projects...' : 
             'Loading workspace...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || projectsError) {
    const displayError = error || projectsError;
    console.log('❌ Workspace: Rendering error state:', displayError);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Workspace</h3>
            <p className="text-red-700 mb-4">{displayError}</p>
            
            {displayError?.includes('connect') && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-900 mb-2">Connection Troubleshooting:</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Check your internet connection</li>
                  <li>• Verify your Supabase project is running</li>
                  <li>• Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correctly set in your .env file</li>
                  <li>• If using local Supabase, run `supabase start`</li>
                </ul>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRetrying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry ({retryCount}/{maxRetries})
                  </>
                )}
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    console.log('⏳ Workspace: Rendering no project state');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  console.log('✅ Workspace: Rendering main workspace content');
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {currentProject.name}
          </h1>
          {currentProject.description && (
            <p className="text-gray-600">{currentProject.description}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Project ID: {currentProject.id}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleAddMissingModules}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Missing Modules
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Grid3X3 className="w-4 h-4 mr-2" />
            Layout
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
          <button 
            onClick={() => {
              setShowDeleteConfirm(true);
            }}
            className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Project
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Delete Project</h2>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-3">
                  Are you sure you want to delete <strong>"{currentProject.name}"</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
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
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
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
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ALL_MODULE_TYPES.map((type) => {
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

      {/* Data Summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-sm font-medium text-blue-900">PRDs</p>
          <p className="text-lg font-bold text-blue-700">{workspaceData.prds.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-sm font-medium text-green-900">Roadmap</p>
          <p className="text-lg font-bold text-green-700">{workspaceData.roadmapItems.length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <p className="text-sm font-medium text-orange-900">Tasks</p>
          <p className="text-lg font-bold text-orange-700">{workspaceData.tasks.length}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-sm font-medium text-yellow-900">Notes</p>
          <p className="text-lg font-bold text-yellow-700">{workspaceData.scratchpadNotes.length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
          <p className="text-sm font-medium text-purple-900">Prompts</p>
          <p className="text-lg font-bold text-purple-700">{workspaceData.prompts.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-sm font-medium text-red-900">Secrets</p>
          <p className="text-lg font-bold text-red-700">{workspaceData.secrets.length}</p>
        </div>
      </div>
    </div>
  );
};