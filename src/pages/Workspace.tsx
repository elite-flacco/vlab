import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import { useAuthStore } from "../stores/authStore";
import { db } from "../lib/supabase";
import { withTimeout, withTiming } from "../lib/utils";
import { Trash2, AlertCircle, RefreshCw, Palette } from "lucide-react";
import { ModuleCard } from "../components/Workspace/ModuleCard";
import { ModuleType } from "../types";

interface WorkspaceData {
  prds: any[];
  roadmapItems: any[];
  tasks: any[];
  scratchpadNotes: any[];
  prompts: any[];
  secrets: any[];
  deploymentItems: any[];
}

const ALL_MODULE_TYPES: ModuleType[] = [
  "prd",
  "roadmap",
  "tasks",
  "scratchpad",
  "prompts",
  "design",
  "deployment",
];

export const Workspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthStore();

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
    error: projectsError,
  } = projectStore;

  const [workspaceData, setWorkspaceData] = useState<WorkspaceData>({
    prds: [],
    roadmapItems: [],
    tasks: [],
    scratchpadNotes: [],
    prompts: [],
    secrets: [],
    deploymentItems: [],
  });
  const [loading, setLoading] = useState(false);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const maxRetries = 3;

  // Combine active and archived projects
  const allProjects = [...(activeProjects || []), ...(archivedProjects || [])];

  // Fetch projects when user is available and we don't have projects yet
  useEffect(() => {
    // Wait for auth to complete initialization before fetching projects
    if (
      user &&
      !authLoading &&
      !projectsLoading &&
      activeProjects.length === 0 &&
      archivedProjects.length === 0 &&
      !projectsError
    ) {
      fetchProjects(user.id);
    }
  }, [
    user,
    authLoading,
    projectsLoading,
    activeProjects.length,
    archivedProjects.length,
    projectsError,
    fetchProjects,
  ]);

  // Memoize fetchWorkspaceData to prevent unnecessary re-renders
  const fetchWorkspaceData = useCallback(
    async (projectId: string, isRetry = false) => {
      // Prevent duplicate fetch attempts by checking loading state
      if (loading && !isRetry) {
        return;
      }

      setLoading(true);
      setError(null);

      if (isRetry) {
        setIsRetrying(true);
      }

      try {
        // Wrap each database call with timeout and timing
        const fetchOperations = [
          withTimeout(
            withTiming("Workspace PRDs", () => db.getPRDs(projectId)),
            10000,
            "PRDs fetch timed out after 10 seconds",
          ),
          withTimeout(
            withTiming("Workspace Roadmap", () =>
              db.getRoadmapItems(projectId),
            ),
            10000,
            "Roadmap items fetch timed out after 10 seconds",
          ),
          withTimeout(
            withTiming("Workspace Tasks", () => db.getTasks(projectId)),
            10000,
            "Tasks fetch timed out after 10 seconds",
          ),
          withTimeout(
            withTiming("Workspace Scratchpad", () =>
              db.getScratchpadNotes(projectId),
            ),
            10000,
            "Scratchpad notes fetch timed out after 10 seconds",
          ),
          withTimeout(
            withTiming("Workspace Prompts", () => db.getPrompts(projectId)),
            10000,
            "Prompts fetch timed out after 10 seconds",
          ),
          withTimeout(
            withTiming("Workspace Secrets", () => db.getSecrets(projectId)),
            10000,
            "Secrets fetch timed out after 10 seconds",
          ),
          withTimeout(
            withTiming("Workspace Deployment", () =>
              db.getDeploymentItems(projectId),
            ),
            10000,
            "Deployment items fetch timed out after 10 seconds",
          ),
        ];

        const [
          prdsResult,
          roadmapResult,
          tasksResult,
          scratchpadResult,
          promptsResult,
          secretsResult,
          deploymentResult,
        ] = await Promise.all(fetchOperations);

        // Check for errors
        if (prdsResult.error) {
          throw prdsResult.error;
        }
        if (roadmapResult.error) {
          throw roadmapResult.error;
        }
        if (tasksResult.error) {
          throw tasksResult.error;
        }
        if (scratchpadResult.error) {
          throw scratchpadResult.error;
        }
        if (promptsResult.error) {
          throw promptsResult.error;
        }
        if (secretsResult.error) {
          throw secretsResult.error;
        }
        if (deploymentResult.error) {
          throw deploymentResult.error;
        }

        const newWorkspaceData = {
          prds: prdsResult.data || [],
          roadmapItems: roadmapResult.data || [],
          tasks: tasksResult.data || [],
          scratchpadNotes: scratchpadResult.data || [],
          prompts: promptsResult.data || [],
          secrets: secretsResult.data || [],
          deploymentItems: deploymentResult.data || [],
        };

        setWorkspaceData(newWorkspaceData);

        // Reset retry count on success
        setRetryCount(0);
      } catch (error: any) {
        // Handle different types of errors
        let errorMessage = "Failed to load workspace data";

        if (error.message?.includes("timed out")) {
          errorMessage = `Database operation timed out: ${error.message}. This might indicate a slow connection or server issues.`;
        } else if (
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("NetworkError")
        ) {
          errorMessage =
            "Unable to connect to the database. Please check your internet connection and Supabase configuration.";
        } else if (
          error.message?.includes("JWT") ||
          error.message?.includes("auth")
        ) {
          errorMessage = "Authentication error. Please try signing in again.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        setError(errorMessage);

        // Don't auto-retry on auth errors or after max retries
        if (
          !error.message?.includes("auth") &&
          retryCount < maxRetries &&
          !isRetry
        ) {
          setRetryCount((prev) => prev + 1);
        }
      } finally {
        setLoading(false);
        setIsRetrying(false);
      }
    },
    [loading, retryCount, maxRetries],
  );

  // Handle project selection and data fetching
  useEffect(() => {
    // Wait for user to be available
    if (!user) {
      return;
    }

    // If we have a projectId but no currentProject or currentProject doesn't match
    if (projectId && (!currentProject || currentProject.id !== projectId)) {
      // Clear workspace data when switching projects
      setWorkspaceData({
        prds: [],
        roadmapItems: [],
        tasks: [],
        scratchpadNotes: [],
        prompts: [],
        secrets: [],
      });

      // First check if project exists in already-loaded projects
      const project = allProjects.find((p) => p.id === projectId);

      if (project) {
        setCurrentProject(project);
      } else if (!projectsLoading && allProjects.length > 0) {
        // Projects have been loaded but project not found in list - try fetching it directly
        setIsProjectLoading(true);

        db.getProject(projectId)
          .then(({ data, error }) => {
            if (error) {
              console.error("❌ Workspace: Error fetching project:", error);
              // Project not found, redirect to dashboard
              navigate("/");
            } else if (data) {
              setCurrentProject(data);
            } else {
              console.log(
                "❌ Workspace: Project not found, redirecting to dashboard",
              );
              navigate("/");
            }
          })
          .catch((error) => {
            console.error("❌ Workspace: Error fetching project:", error);
            navigate("/");
          })
          .finally(() => {
            setIsProjectLoading(false);
          });
      } else if (
        !projectsLoading &&
        allProjects.length === 0 &&
        !projectsError
      ) {
        // No projects exist for user - redirect to dashboard
        console.log(
          "❌ Workspace: No projects exist for user, redirecting to dashboard",
        );
        navigate("/");
      }
      // If projectsLoading is true, we wait for projects to load first
    }

    // Once we have a currentProject that matches the URL, fetch workspace data if needed
    if (currentProject && currentProject.id === projectId) {
      const hasWorkspaceData = Object.values(workspaceData).some(
        (arr) => arr.length > 0,
      );

      if (!hasWorkspaceData && !loading) {
        fetchWorkspaceData(projectId);
      }
    }
  }, [
    projectId,
    allProjects,
    currentProject,
    setCurrentProject,
    fetchWorkspaceData,
    navigate,
    projectsLoading,
    user,
    projectsError,
    workspaceData,
    loading,
  ]);

  const handleAddMissingModules = async () => {
    if (!currentProject) {
      return;
    }

    const defaultModules = ALL_MODULE_TYPES.map((type) => ({
      id: `${type}-1`, // Simple ID for now, ideally UUID
      type: type,
      position: { x: 0, y: 0 }, // Position will be handled by grid layout
      size: { width: 1, height: 1 }, // Size will be handled by grid layout
      data: {},
      is_visible: true,
    }));

    const existingModuleTypes = new Set(
      currentProject.workspace_layout.modules.map((m) => m.type),
    );
    const missingModules = defaultModules.filter(
      (module) => !existingModuleTypes.has(module.type),
    );

    if (missingModules.length > 0) {
      const updatedLayout = {
        ...currentProject.workspace_layout,
        modules: [
          ...currentProject.workspace_layout.modules,
          ...missingModules,
        ],
        grid_config: {
          ...currentProject.workspace_layout.grid_config,
          // Ensure enough rows/columns if needed, though for cards it's less critical
          columns: 3, // Example: 3 columns for cards
          rows: Math.ceil(
            (currentProject.workspace_layout.modules.length +
              missingModules.length) /
              3,
          ),
        },
      };

      await updateWorkspaceLayout(updatedLayout);
      if (projectId) {
        await fetchWorkspaceData(projectId, true);
      }
    }
  };

  const handleDeleteProject = async () => {
    if (!currentProject || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProjectPermanently(currentProject.id);
      // Navigate back to dashboard after successful deletion
      navigate("/");
    } catch (error) {
      console.error("❌ Workspace: Failed to delete project:", error);
      // Error handling is managed by the store
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRetry = () => {
    if (projectId) {
      setRetryCount(0);
      fetchWorkspaceData(projectId, true);
    }
  };

  const getModuleSummary = (type: ModuleType): string => {
    switch (type) {
      case "prd":
        const latestPRD = workspaceData.prds?.[0];
        return latestPRD
          ? `Latest: ${latestPRD.title} (v${latestPRD.version})`
          : "Ready for your first PRD.";
      case "roadmap":
        const completedRoadmapItems =
          workspaceData.roadmapItems?.filter(
            (item) => item.status === "completed",
          ).length || 0;
        const totalRoadmapItems = workspaceData.roadmapItems?.length || 0;
        return totalRoadmapItems > 0
          ? `${totalRoadmapItems} phases, ${completedRoadmapItems} completed.`
          : "Start your roadmap.";
      case "tasks":
        const todoTasks =
          workspaceData.tasks?.filter((task) => task.status === "todo")
            .length || 0;
        const inProgressTasks =
          workspaceData.tasks?.filter((task) => task.status === "in_progress")
            .length || 0;
        const totalTasks = workspaceData.tasks?.length || 0;
        return totalTasks > 0
          ? `${totalTasks} tasks total, ${todoTasks} to do, ${inProgressTasks} in progress.`
          : "No tasks yet.";
      case "scratchpad":
        const notesCount = workspaceData.scratchpadNotes?.length || 0;
        return notesCount > 0
          ? `${notesCount} notes.`
          : "Start writing down your ideas and notes.";
      case "prompts":
        const promptsCount = workspaceData.prompts?.length || 0;
        return promptsCount > 0
          ? `${promptsCount} prompts.`
          : "Save your favorite prompts.";
      case "secrets":
        const activeSecrets =
          workspaceData.secrets?.filter((secret) => secret.is_active).length ||
          0;
        const totalSecrets = workspaceData.secrets?.length || 0;
        return totalSecrets > 0
          ? `${totalSecrets} secrets, ${activeSecrets} active.`
          : "Coming soon.";
      case "design":
        return "AI-powered design assistant.";
      case "deployment":
        const completedDeploymentItems =
          workspaceData.deploymentItems?.filter(
            (item) => item.status === "done",
          ).length || 0;
        const totalDeploymentItems = workspaceData.deploymentItems?.length || 0;
        const criticalItems =
          workspaceData.deploymentItems?.filter(
            (item) => item.priority === "critical" && item.status !== "done",
          ).length || 0;
        return totalDeploymentItems > 0
          ? `${totalDeploymentItems} items, ${completedDeploymentItems} completed${criticalItems > 0 ? `, ${criticalItems} critical pending` : ""}.`
          : "Go-live preparation checklist.";
      default:
        return "Ready to get started.";
    }
  };

  // Show loading only if we don't have a project yet or are still loading projects
  if (
    projectsLoading ||
    isProjectLoading ||
    (!currentProject && !projectsError)
  ) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground-dim font-mono">
            {currentProject
              ? `Loading ${currentProject.name}...`
              : "Loading workspace..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || projectsError) {
    const displayError = error || projectsError;
    return (
      <div className="bg-secondary/50 border border-border rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-error mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-error mb-2 font-mono">
              Error Loading Workspace
            </h3>
            <p className="text-error/90 mb-4">{displayError}</p>

            {displayError?.includes("connection") && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-error/90 mb-2 font-mono">
                  Connection Troubleshooting:
                </h4>
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
              <button onClick={() => navigate("/")} className="btn-ghost">
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
    navigate("/");
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground font-mono">
            {currentProject?.name || "Workspace"}
          </h1>
          {currentProject?.description && (
            <p className="text-foreground-dim text-sm">
              {currentProject.description}
            </p>
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
                  Are you sure you want to delete{" "}
                  <strong className="text-foreground">
                    "{currentProject.name}"
                  </strong>
                  ?
                </p>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-red-400">
                    <strong>Warning:</strong> This action cannot be undone. All
                    project data including PRDs, tasks, roadmaps, notes,
                    prompts, and secrets will be permanently deleted.
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
          // // Special handling for design module
          // if (type === 'design') {
          //   return (
          //     <button
          //       key={type}
          //       onClick={() => navigate(`/workspace/${projectId}/${type}`)}
          //       className="module-card relative overflow-hidden group"
          //     >
          //       <div className="card-header">
          //         <Palette className="module-icon" />
          //       </div>
          //       <h3 className="module-title">Design</h3>
          //       <p className="module-summary">AI-powered design assistant. Coming soon!</p>

          //       {/* Coming Soon Overlay */}
          //       <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          //         <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/30">
          //           <span className="text-primary font-semibold">Coming Soon</span>
          //         </div>
          //       </div>
          //     </button>
          //   );
          // }

          return (
            <ModuleCard
              key={type}
              title={type.charAt(0).toUpperCase() + type.slice(1)}
              type={type}
              summary={getModuleSummary(type)}
              onClick={() => {
                navigate(`/workspace/${projectId}/${type}`);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
