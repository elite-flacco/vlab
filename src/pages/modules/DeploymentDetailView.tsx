import { format } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  ChevronDown,
  Cloud,
  Edit3,
  ExternalLink,
  Loader2,
  Minus,
  Plus,
  Save,
  Search,
  Server,
  Settings,
  Sparkles,
  Square,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BackButton } from "../../components/common/BackButton";
import { ModuleContainer } from "../../components/Workspace/ModuleContainer";
import {
  CATEGORY_TEMPLATES,
  PLATFORM_TEMPLATES,
} from "../../lib/deploymentTemplates";
import { generateDeploymentChecklist } from "../../lib/openai";
import { db } from "../../lib/supabase";
import { DeploymentItem } from "../../types";

export const DeploymentDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [deploymentItems, setDeploymentItems] = useState<DeploymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize filters from localStorage or defaults
  const [filter, setFilter] = useState<
    "all" | "todo" | "in_progress" | "done" | "blocked" | "not_applicable"
  >(() => {
    return (localStorage.getItem("deployment-status-filter") as any) || "all";
  });
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "critical" | "high" | "medium" | "low"
  >(() => {
    return (localStorage.getItem("deployment-priority-filter") as any) || "all";
  });
  const [categoryFilter, setCategoryFilter] = useState<string>(() => {
    return localStorage.getItem("deployment-category-filter") || "all";
  });
  const [platformFilter, setPlatformFilter] = useState<string>(() => {
    const saved = localStorage.getItem("deployment-platform-filter");
    // Reset to 'all' if saved filter is 'general' (no longer valid)
    return saved === "general" ? "all" : saved || "all";
  });
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem("deployment-search-term") || "";
  });
  const [showCompleted, setShowCompleted] = useState(() => {
    const saved = localStorage.getItem("deployment-show-completed");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<DeploymentItem> | null>(null);
  const [saving, setSaving] = useState(false);

  // Auto-generation states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [includeProjectSpecific, setIncludeProjectSpecific] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchDeploymentItems(projectId);
    }
  }, [projectId]);

  // Clean up invalid platform filter from localStorage
  useEffect(() => {
    if (platformFilter === "all") {
      const saved = localStorage.getItem("deployment-platform-filter");
      if (saved === "general") {
        localStorage.setItem("deployment-platform-filter", "all");
      }
    }
  }, [platformFilter]);

  const fetchDeploymentItems = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await db.getDeploymentItems(id);
      if (fetchError) throw fetchError;
      setDeploymentItems(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch deployment items");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const handleUpdateItem = async (
    itemId: string,
    updates: Partial<DeploymentItem>,
  ) => {
    setSaving(true);
    setError(null);

    try {
      const { data, error: updateError } = await db.updateDeploymentItem(
        itemId,
        updates,
      );
      if (updateError) throw updateError;

      const updatedItems = deploymentItems.map((item) =>
        item.id === itemId ? data : item,
      );
      setDeploymentItems(updatedItems);
      setEditingItemId(null);
    } catch (err: any) {
      setError(err.message || "Failed to update deployment item");
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async (itemData: Partial<DeploymentItem>) => {
    if (!projectId) return;

    setSaving(true);
    setError(null);

    try {
      const newItemData = {
        project_id: projectId,
        title: itemData.title || "New Deployment Task",
        description: itemData.description || "",
        category: itemData.category || "general",
        platform: itemData.platform || "universal",
        environment: itemData.environment || "production",
        status: itemData.status || "todo",
        priority: itemData.priority || "medium",
        is_required: itemData.is_required ?? true,
        is_auto_generated: false,
        tags: itemData.tags || [],
        dependencies: itemData.dependencies || [],
        verification_notes: itemData.verification_notes || "",
        helpful_links: itemData.helpful_links || [],
        position: deploymentItems.length,
      };

      const { data, error: createError } =
        await db.createDeploymentItem(newItemData);
      if (createError) throw createError;

      setDeploymentItems((prev) => [...prev, data]);
      setNewItem(null);
    } catch (err: any) {
      setError(err.message || "Failed to create deployment item");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setSaving(true);
    setError(null);

    try {
      const { error: deleteError } = await db.deleteDeploymentItem(itemId);
      if (deleteError) throw deleteError;

      setDeploymentItems((prev) => prev.filter((item) => item.id !== itemId));
      setEditingItemId(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete deployment item");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleItemCompletion = async (
    itemId: string,
    currentStatus: string,
  ) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    await handleUpdateItem(itemId, { status: newStatus });
  };

  const handlePriorityChange = async (itemId: string, newPriority: string) => {
    await handleUpdateItem(itemId, {
      priority: newPriority as DeploymentItem["priority"],
    });
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    await handleUpdateItem(itemId, {
      status: newStatus as DeploymentItem["status"],
    });
  };

  // Custom setters that persist to localStorage
  const updateFilter = (newFilter: typeof filter) => {
    setFilter(newFilter);
    localStorage.setItem("deployment-status-filter", newFilter);
  };

  const updatePriorityFilter = (newPriorityFilter: typeof priorityFilter) => {
    setPriorityFilter(newPriorityFilter);
    localStorage.setItem("deployment-priority-filter", newPriorityFilter);
  };

  const updateCategoryFilter = (newCategoryFilter: string) => {
    setCategoryFilter(newCategoryFilter);
    localStorage.setItem("deployment-category-filter", newCategoryFilter);
  };

  const updatePlatformFilter = (newPlatformFilter: string) => {
    setPlatformFilter(newPlatformFilter);
    localStorage.setItem("deployment-platform-filter", newPlatformFilter);
  };

  const updateSearchTerm = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    localStorage.setItem("deployment-search-term", newSearchTerm);
  };

  const updateShowCompleted = (newShowCompleted: boolean) => {
    setShowCompleted(newShowCompleted);
    localStorage.setItem(
      "deployment-show-completed",
      JSON.stringify(newShowCompleted),
    );
  };

  // Get all unique categories, platforms from existing items
  const getAllCategories = () => {
    const categories = deploymentItems.map((item) => item.category);
    return Array.from(new Set(categories)).sort();
  };

  const getAllPlatforms = () => {
    const platforms = deploymentItems.map((item) => item.platform);
    return Array.from(new Set(platforms)).sort();
  };

  const filteredItems = deploymentItems
    .filter((item) => {
      const matchesStatus =
        filter === "all"
          ? showCompleted ||
            (item.status !== "done" && item.status !== "not_applicable")
          : item.status === filter;

      const matchesPriority =
        priorityFilter === "all" || item.priority === priorityFilter;
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      const matchesPlatform =
        platformFilter === "all" || item.platform === platformFilter;

      const matchesSearch =
        searchTerm === "" ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      return (
        matchesStatus &&
        matchesPriority &&
        matchesCategory &&
        matchesPlatform &&
        matchesSearch
      );
    })
    .sort((a, b) => {
      // First sort by priority (critical > high > medium > low)
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder];
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder];

      const finalPriorityA = priorityA !== undefined ? priorityA : 3;
      const finalPriorityB = priorityB !== undefined ? priorityB : 3;

      if (finalPriorityA !== finalPriorityB) {
        return finalPriorityA - finalPriorityB;
      }

      // If priorities are the same, sort by position
      return a.position - b.position;
    });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "badge-priority-urgent";
      case "high":
        return "badge-priority-high";
      case "medium":
        return "badge-priority-medium";
      default:
        return "badge-priority-low";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <ArrowUp className="w-3 h-3" />;
      case "high":
        return <ArrowUp className="w-3 h-3" />;
      case "medium":
        return <Minus className="w-3 h-3" />;
      default:
        return <ArrowDown className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "badge-secondary";
      case "in_progress":
        return "badge-info";
      case "done":
        return "badge-success";
      case "blocked":
        return "badge-danger";
      case "not_applicable":
        return "badge-warning";
      default:
        return "badge-secondary";
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "todo":
        return "To Do";
      case "in_progress":
        return "In Progress";
      case "done":
        return "Done";
      case "blocked":
        return "Blocked";
      case "not_applicable":
        return "N/A";
      default:
        return status;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "hosting":
        return <Server className="w-4 h-4" />;
      case "database":
        return <Settings className="w-4 h-4" />;
      case "auth":
        return <Settings className="w-4 h-4" />;
      case "env":
        return <Settings className="w-4 h-4" />;
      case "security":
        return <Settings className="w-4 h-4" />;
      case "monitoring":
        return <Settings className="w-4 h-4" />;
      case "testing":
        return <Settings className="w-4 h-4" />;
      case "dns":
        return <Cloud className="w-4 h-4" />;
      case "ssl":
        return <Settings className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string, completed: boolean = false) => {
    if (status === "done" || completed) {
      return <CheckSquare className="w-4 h-4 text-green-600" />;
    }
    return <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />;
  };

  const handleGenerateChecklist = async () => {
    if (!projectId || selectedPlatforms.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      const tasksToCreate: Partial<DeploymentItem>[] = [];

      // 1. Add platform-specific template tasks
      selectedPlatforms.forEach((platform) => {
        const platformTasks = PLATFORM_TEMPLATES[platform] || [];
        platformTasks.forEach((template, index) => {
          tasksToCreate.push({
            ...template,
            project_id: projectId,
            position: deploymentItems.length + tasksToCreate.length,
            dependencies: template.dependencies || [],
          });
        });
      });

      // 2. Add universal category tasks (always include these)
      Object.values(CATEGORY_TEMPLATES).forEach((categoryTasks) => {
        categoryTasks.forEach((template, index) => {
          tasksToCreate.push({
            ...template,
            platform: "universal", // Universal tasks apply to any platform
            project_id: projectId,
            position: deploymentItems.length + tasksToCreate.length,
            dependencies: template.dependencies || [],
          });
        });
      });

      // 3. Generate AI project-specific tasks if requested
      if (includeProjectSpecific) {
        try {
          const aiTasks = await generateDeploymentChecklist({
            platforms: selectedPlatforms,
            projectId: projectId,
          });

          if (aiTasks && Array.isArray(aiTasks)) {
            aiTasks.forEach((aiTask: any) => {
              tasksToCreate.push({
                project_id: projectId,
                title: aiTask.title || "Generated Task",
                description: aiTask.description || "",
                category: aiTask.category || "general",
                platform:
                  aiTask.platform || selectedPlatforms[0] || "universal",
                environment: aiTask.environment || "production",
                status: "todo",
                priority: aiTask.priority || "medium",
                is_required: aiTask.is_required ?? true,
                is_auto_generated: true,
                verification_notes: aiTask.verification_notes || "",
                helpful_links: aiTask.helpful_links || [],
                position: deploymentItems.length + tasksToCreate.length,
              });
            });
          }
        } catch (aiError: any) {
          console.warn(
            "AI generation failed, continuing with templates only:",
            aiError,
          );
          // Continue without AI tasks if AI generation fails
        }
      }

      // 4. Create all tasks in the database
      const createdTasks: DeploymentItem[] = [];
      const failedTasks: string[] = [];

      for (const taskData of tasksToCreate) {
        try {
          const { data, error: createError } =
            await db.createDeploymentItem(taskData);
          if (createError) throw createError;
          createdTasks.push(data);
        } catch (err: any) {
          console.error("Failed to create deployment item:", err);
          failedTasks.push(taskData.title || "Unknown task");
          // Continue creating other tasks even if one fails
        }
      }

      // 5. Update local state with only successfully created tasks
      setDeploymentItems((prev) => [...prev, ...createdTasks]);

      // 6. Close modal and reset state
      setShowGenerateModal(false);
      setSelectedPlatforms([]);
      setIncludeProjectSpecific(true);

      // Show success/error messages
      if (createdTasks.length > 0) {
        console.log(`✅ Generated ${createdTasks.length} deployment tasks`);
      }
      if (failedTasks.length > 0) {
        console.warn(
          `❌ Failed to create ${failedTasks.length} tasks:`,
          failedTasks,
        );
        setError(
          `Created ${createdTasks.length} tasks successfully. ${failedTasks.length} tasks failed due to validation errors.`,
        );
      }
    } catch (error: any) {
      setError(error.message || "Failed to generate deployment checklist");
      console.error("Error generating deployment checklist:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Deployment Checklist" type="deployment">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="loading-spinner"></div>
              <p className="mt-4 text-gray-600">
                Loading deployment checklist...
              </p>
            </div>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Deployment Checklist" type="deployment">
          <div className="card bg-red-50 border-red-200 p-4">
            <p className="card-content text-red-600">{error}</p>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  if (deploymentItems.length === 0 && !newItem) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Deployment Checklist" type="deployment">
          <div className="h-full flex items-center justify-center">
            <div className="text-center pt-4">
              <Cloud className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="mb-2">No Deployment Items Yet</h3>
              <p className="mb-4 text-sm">
                Create deployment checklist items to track your go-live
                preparation.
              </p>
              <div className="flex flex-col gap-3 items-center mb-6">
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="btn-primary"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Auto-Generate Checklist
                </button>
                {/* <button
                  onClick={() => setNewItem({
                    title: '',
                    description: '',
                    category: 'general',
                    platform: 'general',
                    environment: 'production',
                    status: 'todo',
                    priority: 'medium',
                    is_required: true,
                    tags: [],
                    dependencies: [],
                    verification_notes: '',
                    helpful_links: [],
                  })}
                  className="btn-add"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Deployment Item
                </button> */}
              </div>
            </div>
          </div>
        </ModuleContainer>

        {/* Auto-Generate Modal */}
        {showGenerateModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-lg scale-in">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="modal-title">
                    Auto-Generate Deployment Checklist
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Select deployment platforms:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(PLATFORM_TEMPLATES).map((platform) => (
                        <label
                          key={platform}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPlatforms.includes(platform)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPlatforms([
                                  ...selectedPlatforms,
                                  platform,
                                ]);
                              } else {
                                setSelectedPlatforms(
                                  selectedPlatforms.filter(
                                    (p) => p !== platform,
                                  ),
                                );
                              }
                            }}
                            className="form-checkbox"
                          />
                          <span className="text-sm capitalize">{platform}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeProjectSpecific"
                      checked={includeProjectSpecific}
                      onChange={(e) =>
                        setIncludeProjectSpecific(e.target.checked)
                      }
                      className="form-checkbox"
                    />
                    <label
                      htmlFor="includeProjectSpecific"
                      className="text-sm text-foreground"
                    >
                      Include AI-generated project-specific tasks
                    </label>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="text-xs text-foreground-dim">
                      This will add platform-specific deployment tasks and
                      optionally generate custom tasks based on your project
                      details using AI.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    disabled={isGenerating}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateChecklist}
                    disabled={isGenerating || selectedPlatforms.length === 0}
                    className="btn-primary flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Checklist
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Component definitions for reusable elements
  const StatusSelect: React.FC<{
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    showBadgeStyle?: boolean;
  }> = ({ value, onChange, disabled = false, showBadgeStyle = false }) => {
    const selectClass = showBadgeStyle
      ? `appearance-none cursor-pointer ${getStatusColor(value)} disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-none`
      : "form-select w-full";

    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={selectClass}
      >
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
        <option value="blocked">Blocked</option>
        <option value="not_applicable">N/A</option>
      </select>
    );
  };

  const PrioritySelect: React.FC<{
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    showBadgeStyle?: boolean;
    showIcon?: boolean;
  }> = ({
    value,
    onChange,
    disabled = false,
    showBadgeStyle = false,
    showIcon = false,
  }) => {
    const selectClass = showBadgeStyle
      ? `appearance-none cursor-pointer ${getPriorityColor(value)} disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-none ${showIcon ? "pl-7 pr-4" : ""}`
      : "form-select";

    const content = (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={selectClass}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
    );

    if (showIcon) {
      return (
        <div className="relative">
          {content}
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-current">
            {getPriorityIcon(value)}
          </div>
        </div>
      );
    }

    return content;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <BackButton onClick={handleReturnToWorkspace} />
      <ModuleContainer title="Deployment Checklist" type="deployment">
        <div className="h-full flex flex-col">
          {/* Add New Item and Auto-Generate Buttons */}
          {!newItem && (
            <button
              onClick={() =>
                setNewItem({
                  title: "",
                  description: "",
                  category: "hosting",
                  platform: "universal",
                  environment: "production",
                  status: "todo",
                  priority: "medium",
                  is_required: true,
                  tags: [],
                  dependencies: [],
                  verification_notes: "",
                  helpful_links: [],
                  position: deploymentItems.length,
                })
              }
              className="btn-add mb-6"
            >
              <Plus className="w-4 h-4" />
              <span>Add Deployment Checklist Item</span>
            </button>
          )}

          {/* New Item Form */}
          {newItem && (
            <div className="card p-6 mb-6">
              <div className="card-header">
                <h4 className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Deployment Checklist Item
                </h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) =>
                      setNewItem({ ...newItem, title: e.target.value })
                    }
                    className="form-input"
                    placeholder="Enter deployment task title"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
                    className="form-textarea"
                    rows={3}
                    placeholder="Enter task description"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="w-auto">
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Category
                    </label>
                    <select
                      value={newItem.category || "general"}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          category: e.target.value as any,
                        })
                      }
                      className="form-select"
                    >
                      <option value="general">General</option>
                      <option value="hosting">Hosting</option>
                      <option value="database">Database</option>
                      <option value="auth">Authentication</option>
                      <option value="env">Environment</option>
                      <option value="security">Security</option>
                      <option value="monitoring">Monitoring</option>
                      <option value="testing">Testing</option>
                      <option value="dns">DNS</option>
                      <option value="ssl">SSL</option>
                    </select>
                  </div>

                  <div className="w-auto">
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Platform
                    </label>
                    <select
                      value={newItem.platform || "universal"}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          platform: e.target.value as any,
                        })
                      }
                      className="form-select"
                    >
                      <option value="universal">Universal</option>
                      <option value="vercel">Vercel</option>
                      <option value="netlify">Netlify</option>
                      <option value="aws">AWS</option>
                      <option value="gcp">Google Cloud</option>
                      <option value="azure">Azure</option>
                      <option value="heroku">Heroku</option>
                      <option value="digitalocean">DigitalOcean</option>
                      <option value="supabase">Supabase</option>
                    </select>
                  </div>

                  <div className="w-auto">
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Priority
                    </label>
                    <PrioritySelect
                      value={newItem.priority || "medium"}
                      onChange={(priority) =>
                        setNewItem({ ...newItem, priority: priority as any })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAddItem(newItem)}
                    disabled={saving || !newItem.title?.trim()}
                    className="btn-primary"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 mr-1" />
                        Create Item
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setNewItem(null)}
                    disabled={saving}
                    className="btn-outline"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
            {deploymentItems.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-shrink-0">
                  <Search className="search-icon" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => updateSearchTerm(e.target.value)}
                    placeholder="Search deployment items..."
                    className="search-input"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => updateFilter(e.target.value as any)}
                  className="form-select flex-shrink-0"
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Completed</option>
                  <option value="blocked">Blocked</option>
                  <option value="not_applicable">N/A</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => updatePriorityFilter(e.target.value as any)}
                  className="form-select flex-shrink-0"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => updateCategoryFilter(e.target.value)}
                  className="form-select flex-shrink-0"
                >
                  <option value="all">All Categories</option>
                  {getAllCategories().map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
                <select
                  value={platformFilter}
                  onChange={(e) => updatePlatformFilter(e.target.value)}
                  className="form-select flex-shrink-0"
                >
                  <option value="all">All Platforms</option>
                  {getAllPlatforms().map((platform) => (
                    <option key={platform} value={platform}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => updateShowCompleted(!showCompleted)}
                  className={`flex-shrink-0 ${
                    showCompleted ? "filter-button-active" : "filter-button"
                  }`}
                >
                  {showCompleted ? "Hide" : "Show"} Completed
                </button>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`card ${item.status === "done" ? "opacity-75" : ""}`}
              >
                {editingItemId === item.id ? (
                  // Edit Form
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const updatedItems = deploymentItems.map((i) =>
                            i.id === item.id
                              ? { ...i, title: e.target.value }
                              : i,
                          );
                          setDeploymentItems(updatedItems);
                        }}
                        className="form-input"
                        placeholder="Deployment task title"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Description
                      </label>
                      <textarea
                        value={item.description}
                        onChange={(e) => {
                          const updatedItems = deploymentItems.map((i) =>
                            i.id === item.id
                              ? { ...i, description: e.target.value }
                              : i,
                          );
                          setDeploymentItems(updatedItems);
                        }}
                        className="form-textarea"
                        rows={2}
                        placeholder="Task description..."
                      />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">
                          Status
                        </label>
                        <StatusSelect
                          value={item.status}
                          onChange={(status) => {
                            const updatedItems = deploymentItems.map((i) =>
                              i.id === item.id
                                ? { ...i, status: status as any }
                                : i,
                            );
                            setDeploymentItems(updatedItems);
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">
                          Priority
                        </label>
                        <PrioritySelect
                          value={item.priority}
                          onChange={(priority) => {
                            const updatedItems = deploymentItems.map((i) =>
                              i.id === item.id
                                ? { ...i, priority: priority as any }
                                : i,
                            );
                            setDeploymentItems(updatedItems);
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">
                          Category
                        </label>
                        <select
                          value={item.category}
                          onChange={(e) => {
                            const updatedItems = deploymentItems.map((i) =>
                              i.id === item.id
                                ? { ...i, category: e.target.value as any }
                                : i,
                            );
                            setDeploymentItems(updatedItems);
                          }}
                          className="form-select"
                        >
                          <option value="general">General</option>
                          <option value="hosting">Hosting</option>
                          <option value="database">Database</option>
                          <option value="auth">Authentication</option>
                          <option value="env">Environment</option>
                          <option value="security">Security</option>
                          <option value="monitoring">Monitoring</option>
                          <option value="testing">Testing</option>
                          <option value="dns">DNS</option>
                          <option value="ssl">SSL</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">
                          Platform
                        </label>
                        <select
                          value={item.platform}
                          onChange={(e) => {
                            const updatedItems = deploymentItems.map((i) =>
                              i.id === item.id
                                ? { ...i, platform: e.target.value as any }
                                : i,
                            );
                            setDeploymentItems(updatedItems);
                          }}
                          className="form-select"
                        >
                          <option value="universal">Universal</option>
                          <option value="vercel">Vercel</option>
                          <option value="netlify">Netlify</option>
                          <option value="aws">AWS</option>
                          <option value="gcp">Google Cloud</option>
                          <option value="azure">Azure</option>
                          <option value="heroku">Heroku</option>
                          <option value="digitalocean">DigitalOcean</option>
                          <option value="supabase">Supabase</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateItem(item.id, item)}
                        disabled={saving}
                        className="btn-primary"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setEditingItemId(null)}
                        disabled={saving}
                        className="btn-outline"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex items-start space-x-3 group">
                    <button
                      className="mt-0.5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                      onClick={() =>
                        handleToggleItemCompletion(item.id, item.status)
                      }
                      disabled={saving}
                    >
                      {getStatusIcon(item.status)}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4
                            className={`text-sm flex items-center gap-2 ${item.status === "done" ? "line-through text-foreground-dim" : "text-foreground"}`}
                          >
                            {getCategoryIcon(item.category)}
                            {item.title}
                            {item.is_required && (
                              <span className="text-xs text-red-500">*</span>
                            )}
                          </h4>
                          {item.description && (
                            <p className="card-content mt-1 text-sm">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-2">
                          <StatusSelect
                            value={item.status}
                            onChange={(status) =>
                              handleStatusChange(item.id, status)
                            }
                            disabled={saving}
                            showBadgeStyle={true}
                          />
                          <PrioritySelect
                            value={item.priority}
                            onChange={(priority) =>
                              handlePriorityChange(item.id, priority)
                            }
                            disabled={saving}
                            showBadgeStyle={true}
                            showIcon={true}
                          />
                          <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingItemId(item.id)}
                              className="p-1.5 text-foreground-dim hover:text-primary hover:bg-foreground-dim/10 rounded-lg transition-colors"
                              title="Edit item"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={saving}
                              className="p-1 text-foreground-dim hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Delete item"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center flex-wrap gap-1 mt-2">
                        <div className="flex items-center space-x-1">
                          <Tag className="w-3 h-3 text-foreground-dim" />
                          <span className="text-xs text-foreground-dim">
                            {item.category.charAt(0) +
                              item.category.slice(1) +
                              ", "}
                          </span>
                          <span className="text-xs text-foreground-dim">
                            {item.platform.charAt(0) + item.platform.slice(1)}
                          </span>
                          {item.environment !== "production" && (
                            <span className="text-xs text-foreground-dim">
                              {", " + item.environment}
                            </span>
                          )}
                        </div>
                        {item.helpful_links &&
                          item.helpful_links.length > 0 && (
                            <div className="flex items-center">
                              <button
                                onClick={() =>
                                  window.open(
                                    item.helpful_links[0].url,
                                    "_blank",
                                    "noopener,noreferrer",
                                  )
                                }
                                disabled={saving}
                                className="p-1 text-foreground-dim hover:text-primary hover:bg-foreground-dim/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Open helpful links"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {
                deploymentItems.filter(
                  (i) => i.status !== "done" && i.status !== "not_applicable",
                ).length
              }{" "}
              active •
              {deploymentItems.filter((i) => i.status === "done").length}{" "}
              completed •
              {
                deploymentItems.filter((i) => i.status === "not_applicable")
                  .length
              }{" "}
              N/A
            </div>
            <div className="text-xs text-gray-500">
              Progress:{" "}
              {Math.round(
                (deploymentItems.filter((i) => i.status === "done").length /
                  deploymentItems.length) *
                  100,
              ) || 0}
              %
            </div>
          </div>
        </div>
      </ModuleContainer>

      {/* Auto-Generate Modal */}
      {showGenerateModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg scale-in">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h2 className="modal-title">
                  Auto-Generate Deployment Checklist
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Select deployment platforms:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(PLATFORM_TEMPLATES).map((platform) => (
                      <label
                        key={platform}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes(platform)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPlatforms([
                                ...selectedPlatforms,
                                platform,
                              ]);
                            } else {
                              setSelectedPlatforms(
                                selectedPlatforms.filter((p) => p !== platform),
                              );
                            }
                          }}
                          className="form-checkbox"
                        />
                        <span className="text-sm capitalize">{platform}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeProjectSpecific"
                    checked={includeProjectSpecific}
                    onChange={(e) =>
                      setIncludeProjectSpecific(e.target.checked)
                    }
                    className="form-checkbox"
                  />
                  <label
                    htmlFor="includeProjectSpecific"
                    className="text-sm text-foreground"
                  >
                    Include AI-generated project-specific tasks
                  </label>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs text-foreground-dim">
                    This will add platform-specific deployment tasks and
                    optionally generate custom tasks based on your project
                    details using AI.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  disabled={isGenerating}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateChecklist}
                  disabled={isGenerating || selectedPlatforms.length === 0}
                  className="btn-primary flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Checklist
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
