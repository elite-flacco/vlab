import {
  Cloud,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { generateDeploymentChecklist } from "../../lib/openai";
import { db } from "../../lib/supabase";
import type { RoadmapItem } from "../../types";

interface DeploymentItem {
  title: string;
  description: string;
  category:
    | "general"
    | "hosting"
    | "database"
    | "auth"
    | "env"
    | "security"
    | "monitoring"
    | "testing"
    | "dns"
    | "ssl";
  platform:
    | "general"
    | "vercel"
    | "netlify"
    | "aws"
    | "gcp"
    | "azure"
    | "heroku"
    | "digitalocean"
    | "supabase";
  environment: "development" | "staging" | "production";
  status: "todo" | "in_progress" | "done" | "blocked" | "not_applicable";
  priority: "low" | "medium" | "high" | "critical";
  is_required: boolean;
  verification_notes: string;
  helpful_links: Array<{ title: string; url: string; description?: string }>;
  position: number;
}

interface DeploymentGeneratorProps {
  projectId: string;
  prdContent: string;
  roadmapItems: RoadmapItem[];
  onDeploymentGenerated: (deploymentData: {
    deploymentItems: DeploymentItem[];
    count: number;
  }) => void;
}

export const DeploymentGenerator: React.FC<DeploymentGeneratorProps> = ({
  projectId,
  prdContent,
  roadmapItems,
  onDeploymentGenerated,
}) => {
  const [deploymentItems, setDeploymentItems] = useState<DeploymentItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleGenerateDeploymentItems = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const generatedItems = await generateDeploymentChecklist({
        platforms: ["general"], // default platforms
        projectId,
        prdContent,
        roadmapItems,
      });
      setDeploymentItems(generatedItems);
      setHasGenerated(true);
    } catch (error) {
      console.error(
        "DeploymentGenerator Debug - Error generating deployment items:",
        error
      );
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate deployment checklist"
      );
    } finally {
      setIsGenerating(false);
    }
  }, [prdContent, roadmapItems, projectId]);

  // Auto-generate deployment items when component mounts
  useEffect(() => {
    if (prdContent && roadmapItems.length > 0 && !hasGenerated) {
      handleGenerateDeploymentItems();
    }
  }, [prdContent, roadmapItems, hasGenerated, handleGenerateDeploymentItems]);

  const handleSaveDeploymentItems = async () => {
    if (deploymentItems.length === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      // Save each deployment item to database
      const savedItems = [];
      for (const item of deploymentItems) {
        const { data: savedItem, error: saveError } =
          await db.createDeploymentItem({
            project_id: projectId,
            title: item.title,
            description: item.description,
            category: item.category,
            platform: item.platform,
            environment: item.environment,
            status: item.status,
            priority: item.priority,
            is_required: item.is_required,
            is_auto_generated: true,
            verification_notes: item.verification_notes,
            helpful_links: item.helpful_links,
            tags: [], // We can add tags later if needed
            dependencies: [],
            position: item.position,
          });

        if (saveError) throw saveError;
        savedItems.push(savedItem);
      }

      // Call the callback with deployment data
      onDeploymentGenerated({
        deploymentItems,
        count: deploymentItems.length,
      });
    } catch (error) {
      console.error("Error saving deployment items:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save deployment checklist"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = () => {
    const newItem: DeploymentItem = {
      title: "New Deployment Task",
      description: "Add deployment task description here...",
      category: "general",
      platform: "general",
      environment: "production",
      status: "todo",
      priority: "medium",
      is_required: true,
      verification_notes: "",
      helpful_links: [],
      position: deploymentItems.length,
    };
    setDeploymentItems([...deploymentItems, newItem]);
    setEditingIndex(deploymentItems.length);
  };

  const handleUpdateItem = (
    index: number,
    updates: Partial<DeploymentItem>
  ) => {
    const updatedItems = deploymentItems.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    );
    setDeploymentItems(updatedItems);
  };

  const handleDeleteItem = (index: number) => {
    const updatedItems = deploymentItems.filter((_, i) => i !== index);
    // Update positions
    const reorderedItems = updatedItems.map((item, i) => ({
      ...item,
      position: i,
    }));
    setDeploymentItems(reorderedItems);
    setEditingIndex(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "hosting":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "database":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "auth":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "env":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "security":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "monitoring":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "testing":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "dns":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "ssl":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      default:
        return "bg-muted text-foreground/80 border-border";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      default:
        return "bg-muted text-foreground/80 border-border";
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "vercel":
        return "bg-black text-white border-gray-600";
      case "netlify":
        return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case "aws":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "gcp":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "azure":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "heroku":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "digitalocean":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "supabase":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      default:
        return "bg-muted text-foreground/80 border-border";
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {hasGenerated && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-secondary"
            >
              <Edit3 className="w-3 h-3 mr-2" />
              {isEditing ? "Done Editing" : "Edit Items"}
            </button>
          )}

          {hasGenerated && (
            <button
              onClick={handleGenerateDeploymentItems}
              disabled={isGenerating}
              className="btn-secondary"
            >
              <RefreshCw
                className={`w-3 h-3 mr-2 ${isGenerating ? "animate-spin" : ""}`}
              />
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="bg-card border border-border rounded-lg flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Generating Deployment Checklist
            </h3>
            <p className="text-foreground-dim">
              AI is analyzing your project to create a comprehensive go-live
              checklist...
            </p>
          </div>
        </div>
      )}

      {/* Deployment Items List */}
      {hasGenerated && !isGenerating && (
        <div className="flex-1 flex flex-col">
          <div className="bg-card border border-border rounded-lg p-6 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {deploymentItems.map((item, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  {editingIndex === index ? (
                    <div className="space-y-4 p-2">
                      <div>
                        <input
                          type="text"
                          value={item.title}
                          onChange={e =>
                            handleUpdateItem(index, { title: e.target.value })
                          }
                          className="form-input w-full"
                          placeholder="Deployment task title"
                        />
                      </div>
                      <div>
                        <textarea
                          value={item.description}
                          onChange={e =>
                            handleUpdateItem(index, {
                              description: e.target.value,
                            })
                          }
                          className="form-textarea w-full"
                          placeholder="Task description..."
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-foreground/80 mb-1.5">
                            Category
                          </label>
                          <select
                            value={item.category}
                            onChange={e =>
                              handleUpdateItem(index, {
                                category: e.target.value as any,
                              })
                            }
                            className="form-select w-full"
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
                          <label className="block text-xs font-medium text-foreground/80 mb-1.5">
                            Platform
                          </label>
                          <select
                            value={item.platform}
                            onChange={e =>
                              handleUpdateItem(index, {
                                platform: e.target.value as any,
                              })
                            }
                            className="form-select w-full"
                          >
                            <option value="general">General</option>
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
                        <div>
                          <label className="block text-xs font-medium text-foreground/80 mb-1.5">
                            Priority
                          </label>
                          <select
                            value={item.priority}
                            onChange={e =>
                              handleUpdateItem(index, {
                                priority: e.target.value as any,
                              })
                            }
                            className="form-select w-full"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground/80 mb-1.5">
                            Required
                          </label>
                          <input
                            type="checkbox"
                            checked={item.is_required}
                            onChange={e =>
                              handleUpdateItem(index, {
                                is_required: e.target.checked,
                              })
                            }
                            className="w-4 h-4 mt-2"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground/80 mb-1.5">
                          Verification Notes
                        </label>
                        <textarea
                          value={item.verification_notes}
                          onChange={e =>
                            handleUpdateItem(index, {
                              verification_notes: e.target.value,
                            })
                          }
                          className="form-textarea w-full"
                          placeholder="How to verify this task is complete..."
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border/20">
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="btn-secondary"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(index)}
                          className="btn-danger"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="mb-1 flex items-center">
                            {item.title}
                            {item.is_required && (
                              <span className="ml-1 text-red-500 text-xs">
                                *
                              </span>
                            )}
                          </h5>
                          <p className="text-foreground-dim text-sm leading-relaxed">
                            {item.description}
                          </p>
                          {item.verification_notes && (
                            <p className="text-foreground-dim text-xs mt-1 italic">
                              Verify: {item.verification_notes}
                            </p>
                          )}
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => setEditingIndex(index)}
                            className="ml-4 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center flex-wrap gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}
                        >
                          {item.category.charAt(0).toUpperCase() +
                            item.category.slice(1)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getPlatformColor(item.platform)}`}
                        >
                          {item.platform.charAt(0).toUpperCase() +
                            item.platform.slice(1)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}
                        >
                          {item.priority}
                        </span>
                        {item.helpful_links &&
                          item.helpful_links.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {item.helpful_links.length} helpful link
                              {item.helpful_links.length !== 1 ? "s" : ""}
                            </span>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Item Button */}
              {isEditing && (
                <button onClick={handleAddItem} className="w-full btn-add">
                  <Plus className="w-5 h-5" />
                  <span>Add Deployment Item</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {hasGenerated && !isGenerating && (
        <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
          <div className="text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>
                Review your deployment checklist, then save to continue
              </span>
            </span>
          </div>

          <button
            onClick={handleSaveDeploymentItems}
            disabled={deploymentItems.length === 0 || isSaving}
            className="btn-primary"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Checklist...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Checklist & Continue
              </>
            )}
          </button>
        </div>
      )}

      {/* Initial Generate Button */}
      {!hasGenerated && !isGenerating && (
        <div className="bg-card border border-border rounded-lg flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <Cloud className="w-12 h-12 text-warning/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ready to Generate Deployment Checklist
            </h3>
            <p className="text-foreground/90 mb-6">
              I'll create a comprehensive go-live checklist based on your PRD
              and roadmap, including platform-specific tasks for popular hosting
              providers.
            </p>
            <button
              onClick={handleGenerateDeploymentItems}
              className="btn-primary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Deployment Checklist
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
