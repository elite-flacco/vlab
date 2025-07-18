import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';
import { BackButton } from '../../components/common/BackButton';
import { Palette, Sparkles, Zap, Layers, PenTool, Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { db, supabase } from '../../lib/supabase';
import { generateDesignTasks } from '../../lib/openai';
import { v4 as uuidv4 } from 'uuid';

interface GeneratedTask {
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'highest';
  estimated_hours?: number;
  due_date?: string;
  tags: string[];
  dependencies: string[];
  position: number;
}

export const DesignDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [feedbackText, setFeedbackText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReturnToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const generateTasks = async () => {
    if (!feedbackText.trim()) {
      setError('Please enter some design feedback text');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const tasks = await generateDesignTasks(feedbackText);
      setGeneratedTasks(tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tasks');
    } finally {
      setIsGenerating(false);
    }
  };

  const addTasksToProject = async () => {
    if (!projectId || generatedTasks.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to add tasks');
        return;
      }

      // Add each generated task to the database using the db helper
      for (const task of generatedTasks) {
        const taskData = {
          project_id: projectId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          tags: task.tags,
          estimated_hours: task.estimated_hours,
          due_date: task.due_date,
          dependencies: task.dependencies,
          position: task.position,
        };

        const { error: insertError } = await db.createTask(taskData);
        if (insertError) {
          throw insertError;
        }
      }

      setSuccess(`Successfully added ${generatedTasks.length} tasks to your project!`);
      setGeneratedTasks([]);
      setFeedbackText('');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tasks');
    } finally {
      setIsGenerating(false);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'highest': return 'badge-priority-urgent';   // Red for critical/highest
      case 'high': return 'badge-priority-high';       // Orange for high
      case 'medium': return 'badge-priority-medium';   // Yellow for medium  
      case 'low': return 'badge-priority-low';         // Green for low
      default: return 'badge-priority-low';            // Default to low
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <BackButton onClick={handleReturnToWorkspace} />
      <ModuleContainer title="Design Co-Pilot" type="design">
        <div className="h-full flex flex-col p-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Palette className="w-8 h-8 text-primary" />
            </div>
            <h2 className="mb-2">Design Co-Pilot</h2>
            <p className="text-foreground-dim text-sm">
              Paste design feedback and automatically generate tasks
            </p>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label htmlFor="feedback" className="block text-sm font-medium text-foreground mb-2">
                Design Feedback
              </label>
              <textarea
                id="feedback"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Paste your design feedback here... For example: 'The header feels too cramped on mobile. The call-to-action button needs more contrast. The navigation could be more intuitive.'"
                className="form-textarea min-h-[8rem]"
                disabled={isGenerating}
              />
            </div>

            <button
              onClick={generateTasks}
              disabled={isGenerating || !feedbackText.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating Tasks...' : 'Generate Tasks'}
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-800">{success}</span>
            </div>
          )}

          {/* Generated Tasks */}
          {generatedTasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Generated Tasks</h3>
                <button
                  onClick={addTasksToProject}
                  disabled={isGenerating}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add {generatedTasks.length} Tasks
                </button>
              </div>

              <div className="space-y-3">
                {generatedTasks.map((task, index) => (
                  <div key={index} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4>{task.title}</h4>
                      <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-foreground-dim text-sm mb-3">{task.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="badge-info">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ModuleContainer>
    </div>
  );
};