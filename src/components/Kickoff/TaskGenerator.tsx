import { format } from 'date-fns';
import { Calendar, Clock, Edit3, ListTodo, Loader2, Plus, RefreshCw, Save, Sparkles, Tag, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { generateTasks } from '../../lib/openai';
import { db } from '../../lib/supabase';

interface TaskItem {
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_hours?: number;
  due_date?: string;
  tags: string[];
  dependencies: string[];
  position: number;
}

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

interface TaskGeneratorProps {
  projectId: string;
  prdContent: string;
  roadmapItems: RoadmapItem[];
  onTasksGenerated: (tasksData: { tasks: TaskItem[]; count: number }) => void;
}

export const TaskGenerator: React.FC<TaskGeneratorProps> = ({
  projectId,
  prdContent,
  roadmapItems,
  onTasksGenerated
}) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Debug logging for component props
  useEffect(() => {
    console.log('🔍 TaskGenerator Debug - Component Mounted');
    console.log('  - projectId:', projectId);
    console.log('  - prdContent length:', prdContent?.length || 0);
    console.log('  - roadmapItems count:', roadmapItems?.length || 0);
    console.log('  - roadmapItems:', roadmapItems);
    console.log('  - hasGenerated:', hasGenerated);
  }, []);

  // Auto-generate tasks when component mounts
  useEffect(() => {
    console.log('🔍 TaskGenerator Debug - useEffect Trigger');
    console.log('  - prdContent exists:', !!prdContent);
    console.log('  - roadmapItems.length:', roadmapItems?.length || 0);
    console.log('  - hasGenerated:', hasGenerated);
    console.log('  - Condition met:', prdContent && roadmapItems.length > 0 && !hasGenerated);

    if (prdContent && roadmapItems.length > 0 && !hasGenerated) {
      console.log('🔍 TaskGenerator Debug - Triggering handleGenerateTasks');
      handleGenerateTasks();
    }
  }, [prdContent, roadmapItems, hasGenerated]);

  const handleGenerateTasks = async () => {
    console.log('🔍 TaskGenerator Debug - handleGenerateTasks called');
    setIsGenerating(true);
    setError(null);

    try {
      console.log('🔍 TaskGenerator Debug - Calling generateTasks API');
      const generatedTasks = await generateTasks(prdContent, roadmapItems);
      console.log('🔍 TaskGenerator Debug - Generated tasks:', generatedTasks);
      setTasks(generatedTasks);
      setHasGenerated(true);
    } catch (error) {
      console.error('🔍 TaskGenerator Debug - Error generating tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate tasks');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTasks = async () => {
    if (tasks.length === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      // Save each task to database
      const savedTasks = [];
      for (const task of tasks) {
        const { data: savedTask, error: saveError } = await db.createTask({
          project_id: projectId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          estimated_hours: task.estimated_hours,
          due_date: task.due_date,
          tags: task.tags,
          dependencies: task.dependencies,
          position: task.position,
        });

        if (saveError) throw saveError;
        savedTasks.push(savedTask);
      }

      // Call the callback with task data
      onTasksGenerated({
        tasks,
        count: tasks.length,
      });
    } catch (error) {
      console.error('Error saving tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to save tasks');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTask = () => {
    const newTask: TaskItem = {
      title: 'New Task',
      description: 'Add task description here...',
      status: 'todo',
      priority: 'medium',
      estimated_hours: 4,
      // Don't include due_date at all when it's not set to match the interface
      tags: [],
      dependencies: [],
      position: tasks.length,
    };
    setTasks([...tasks, newTask]);
    setEditingIndex(tasks.length);
  };

  const handleUpdateTask = (index: number, updates: Partial<TaskItem>) => {
    const updatedTasks = tasks.map((task, i) =>
      i === index ? { ...task, ...updates } : task
    );
    setTasks(updatedTasks);
  };

  const handleDeleteTask = (index: number) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    // Update positions
    const reorderedTasks = updatedTasks.map((task, i) => ({ ...task, position: i }));
    setTasks(reorderedTasks);
    setEditingIndex(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-success/10 text-success border-success/20';
      case 'in_progress': return 'bg-primary/10 text-primary border-primary/20';
      case 'blocked': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-foreground/80 border-border';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-muted text-foreground/80 border-border';
    }
  };

  const formatTagsInput = (tags: string[]) => tags.join(', ');
  const parseTagsInput = (input: string) =>
    input.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {/* <div className="flex items-center space-x-4">
          <div>
            <h3>Task Breakdown</h3>
            <p className="text-sm text-foreground-dim">AI-generated tasks based on your PRD and roadmap</p>
          </div>
        </div> */}

        <div className="flex items-center space-x-2">
          {hasGenerated && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-secondary"
            >
              <Edit3 className="w-3 h-3 mr-2" />
              {isEditing ? 'Done Editing' : 'Edit Tasks'}
            </button>
          )}

          {hasGenerated && (
            <button
              onClick={handleGenerateTasks}
              disabled={isGenerating}
              className="btn-secondary"
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Context Info */}
      {/* <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 mb-6">
        <h5 className="mb-2">Based on your project:</h5>
        <div className="text-sm text-foreground/70 space-y-1">
          <p className="text-sm">• PRD with {prdContent.split('\n').length} sections</p>
          <p className="text-sm">• {roadmapItems.length} roadmap phases: {roadmapItems.map(item => item.title).join(', ')}</p>
        </div>
      </div> */}

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
            <h3 className="text-lg font-semibold text-foreground mb-2">Generating Your Tasks</h3>
            <p className="text-foreground-dim">
              AI is analyzing your PRD and roadmap to create actionable development tasks...
            </p>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {hasGenerated && !isGenerating && (
        <div className="flex-1 flex flex-col">
          <div className="bg-card border border-border rounded-lg p-6 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div key={index} className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  {editingIndex === index ? (
                    <div className="space-y-4 p-2">
                      <div>
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => handleUpdateTask(index, { title: e.target.value })}
                          className="form-input w-full"
                          placeholder="Task title"
                        />
                      </div>
                      <div>
                        <textarea
                          value={task.description}
                          onChange={(e) => handleUpdateTask(index, { description: e.target.value })}
                          className="form-textarea w-full"
                          placeholder="Task description..."
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-foreground/80 mb-1.5">Priority</label>
                          <select
                            value={task.priority}
                            onChange={(e) => handleUpdateTask(index, { priority: e.target.value as any })}
                            className="form-select w-full"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground/80 mb-1.5">Due Date</label>
                          <div className="relative w-full">
                            <input
                              type="date"
                              value={task.due_date || ''}
                              onChange={(e) => handleUpdateTask(index, { due_date: e.target.value || undefined })}
                              className="form-input w-full text-foreground bg-background border border-foreground-dim/30 rounded-md shadow-sm text-sm font-mono px-3 py-2 pr-10"
                              style={{
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                                appearance: 'none',
                              }}
                            />
                            <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground/80 mb-1.5">Tags</label>
                        <input
                          type="text"
                          value={formatTagsInput(task.tags)}
                          onChange={(e) => handleUpdateTask(index, { tags: parseTagsInput(e.target.value) })}
                          className="form-input w-full"
                          placeholder="frontend, backend, design"
                        />
                        <p className="mt-2 text-xs text-foreground/60">Separate tags with commas</p>
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
                          onClick={() => handleDeleteTask(index)}
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
                          <h5 className="mb-1">{task.title}</h5>
                          <p className="text-foreground-dim text-sm leading-relaxed">{task.description}</p>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className="flex items-center space-x-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(task.due_date), 'MMM d')}</span>
                          </span>
                        )}
                        {task.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Tag className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-muted-foreground">
                              {task.tags.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Task Button */}
              {isEditing && (
                <button
                  onClick={handleAddTask}
                  className="w-full btn-add"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Task</span>
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
              <span>Review your tasks, then save to continue</span>
            </span>
          </div>

          <button
            onClick={handleSaveTasks}
            disabled={tasks.length === 0 || isSaving}
            className="btn-primary"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Tasks...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Tasks & Continue
              </>
            )}
          </button>
        </div>
      )}

      {/* Initial Generate Button */}
      {!hasGenerated && !isGenerating && (
        <div className="bg-card border border-border rounded-lg flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <ListTodo className="w-12 h-12 text-warning/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Generate Your Tasks</h3>
            <p className="text-foreground/90 mb-6">
              I'll create actionable development tasks based on your PRD and roadmap, breaking down the work into manageable pieces.
            </p>
            <button
              onClick={handleGenerateTasks}
              className="btn-primary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Tasks
            </button>
          </div>
        </div>
      )}
    </div>
  );
};