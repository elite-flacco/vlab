import React, { useState, useEffect } from 'react';
import { Map, Sparkles, Save, Edit3, Plus, Trash2, Loader2, RefreshCw, Calendar, Target } from 'lucide-react';
import { generateRoadmap } from '../../lib/openai';
import { db } from '../../lib/supabase';

interface RoadmapItem {
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed';
  start_date?: string;
  end_date?: string;
  milestone: boolean;
  color: string;
  position: number;
}

interface RoadmapGeneratorProps {
  projectId: string;
  prdContent: string;
  onRoadmapGenerated: (roadmapData: { items: RoadmapItem[]; count: number }) => void;
}

export const RoadmapGenerator: React.FC<RoadmapGeneratorProps> = ({ 
  projectId, 
  prdContent, 
  onRoadmapGenerated 
}) => {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Auto-generate roadmap when component mounts
  useEffect(() => {
    if (prdContent && !hasGenerated) {
      handleGenerateRoadmap();
    }
  }, [prdContent, hasGenerated]);

  const handleGenerateRoadmap = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const generatedItems = await generateRoadmap(prdContent);
      setRoadmapItems(generatedItems);
      setHasGenerated(true);
    } catch (error) {
      console.error('Error generating roadmap:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate roadmap');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveRoadmap = async () => {
    if (roadmapItems.length === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      // Save each roadmap item to database
      const savedItems = [];
      for (const item of roadmapItems) {
        const { data: roadmapItem, error: saveError } = await db.createRoadmapItem({
          project_id: projectId,
          title: item.title,
          description: item.description,
          status: item.status,
          start_date: item.start_date || null,
          end_date: item.end_date || null,
          milestone: item.milestone,
          color: item.color,
          position: item.position,
        });

        if (saveError) throw saveError;
        savedItems.push(roadmapItem);
      }

      // Call the callback with roadmap data
      onRoadmapGenerated({
        items: roadmapItems,
        count: roadmapItems.length,
      });
    } catch (error) {
      console.error('Error saving roadmap:', error);
      setError(error instanceof Error ? error.message : 'Failed to save roadmap');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = () => {
    const newItem: RoadmapItem = {
      title: 'New Roadmap Item',
      description: 'Add description here...',
      status: 'planned',
      milestone: false,
      color: '#3b82f6',
      position: roadmapItems.length,
    };
    setRoadmapItems([...roadmapItems, newItem]);
    setEditingIndex(roadmapItems.length);
  };

  const handleUpdateItem = (index: number, updates: Partial<RoadmapItem>) => {
    const updatedItems = roadmapItems.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    );
    setRoadmapItems(updatedItems);
  };

  const handleDeleteItem = (index: number) => {
    const updatedItems = roadmapItems.filter((_, i) => i !== index);
    // Update positions
    const reorderedItems = updatedItems.map((item, i) => ({ ...item, position: i }));
    setRoadmapItems(reorderedItems);
    setEditingIndex(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'in_progress': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-foreground/80 border-border';
    }
  };

  const getPhaseLabel = (index: number) => {
    if (index === 0) return 'MVP';
    if (index === 1) return 'Phase 2';
    if (index === 2) return 'Backlog';
    return `Phase ${index + 1}`;
  };

  const getPhaseColor = (index: number) => {
    const phase = index === 0 ? 'mvp' : index === 1 ? 'phase_2' : 'backlog';
    switch (phase) {
      case 'mvp': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'phase_2': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'backlog': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        {/* <div>
          <h3>Project Roadmap</h3>
          <p className="text-sm text-foreground-dim">AI-generated roadmap based on your PRD</p>
        </div> */}

        <div className="flex items-center space-x-2">
          {hasGenerated && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-secondary"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditing ? 'Done Editing' : 'Edit Items'}
            </button>
          )}
          
          {hasGenerated && (
            <button
              onClick={handleGenerateRoadmap}
              disabled={isGenerating}
              className="btn-secondary"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-6">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="bg-card border border-border rounded-lg flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <h3 className="mb-2">Generating Your Roadmap</h3>
            <p className="text-foreground-dim">
              AI is analyzing your PRD and creating a phased development roadmap...
            </p>
          </div>
        </div>
      )}

      {/* Roadmap Items */}
      {hasGenerated && !isGenerating && (
        <div className="flex-1 flex flex-col bg-background">
          <div className="bg-card border border-border rounded-lg p-6 flex-1 overflow-y-auto">
            <div className="space-y-6">
              {roadmapItems.map((item, index) => (
                <div key={index} className="relative">
                  {/* Phase Label */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`px-3 py-1 rounded-md text-xs font-medium ${getPhaseColor(index)}`}>
                      {getPhaseLabel(index)}
                    </div>
                  </div>

                  <div className="card bg-muted/20 border border-border rounded-lg p-4">
                    {editingIndex === index ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateItem(index, { title: e.target.value })}
                          className="form-input"
                          placeholder="Roadmap item title"
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => handleUpdateItem(index, { description: e.target.value })}
                          className="form-textarea min-h-[100px]"
                          placeholder="Description of this phase..."
                        />
                        <div className="flex flex-wrap gap-4">
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateItem(index, { status: e.target.value as any })}
                            className="form-select flex-1 min-w-[150px]"
                          >
                            <option value="planned">Planned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="btn-secondary"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => handleDeleteItem(index)}
                            className="btn-danger"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h5>{item.title}</h5>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-2xs border ${getStatusColor(item.status)}`}>
                              {item.status.replace('_', ' ')}
                            </span>
                            {isEditing && (
                              <button
                                onClick={() => setEditingIndex(index)}
                                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-foreground-dim text-sm leading-relaxed">{item.description}</p>
                        {(item.start_date || item.end_date) && (
                          <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                            {item.start_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Start: {new Date(item.start_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            {item.end_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>End: {new Date(item.end_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Connection Line */}
                  {index < roadmapItems.length - 1 && (
                    <div className="flex justify-center my-4">
                      <div className="w-0.5 h-6 bg-border"></div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Item Button */}
              {isEditing && (
                <button
                  onClick={handleAddItem}
                  className="btn-add w-full"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add Roadmap Item</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {hasGenerated && !isGenerating && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-border mt-8">
          <div className="text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Review your roadmap phases, then save to continue</span>
            </span>
          </div>
          
          <button
            onClick={handleSaveRoadmap}
            disabled={roadmapItems.length === 0 || isSaving}
            className="btn-primary w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Roadmap...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Roadmap & Continue
              </>
            )}
          </button>
        </div>
      )}

      {/* Initial Generate Button */}
      {!hasGenerated && !isGenerating && (
        <div className="bg-card border border-border rounded-lg flex-1 p-8 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Map className="w-12 h-12 text-primary/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Generate Your Roadmap</h3>
            <p className="text-foreground-dim mb-6">
              I'll create a phased development roadmap based on your PRD, breaking down the work into manageable phases.
            </p>
            <button
              onClick={handleGenerateRoadmap}
              className="btn-primary w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Roadmap
            </button>
          </div>
        </div>
      )}
    </div>
  );
};