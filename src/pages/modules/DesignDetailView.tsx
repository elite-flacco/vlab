import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';
import { BackButton } from '../../components/common/BackButton';
import { Palette, Sparkles, Zap, Layers, PenTool, Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { db } from '../../lib/supabase';
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
      const { data: { user } } = await db.auth.getUser();
      if (!user) {
        setError('You must be logged in to add tasks');
        return;
      }

      // Add each generated task to the database using the db helper
      for (const task of generatedTasks) {
        const taskData = {
          id: uuidv4(),
          project_id: projectId,
          user_id: user.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          tags: task.tags,
          estimated_hours: task.estimated_hours,
          due_date: task.due_date,
          dependencies: task.dependencies,
          position: task.position,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'highest': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
            <h2 className="text-2xl font-bold text-foreground mb-2">Design Co-Pilot</h2>
            <p className="text-foreground-dim text-sm">
              Paste design feedback and automatically generate actionable tasks for your team
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
                className="w-full h-32 p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                disabled={isGenerating}
              />
            </div>

            <button
              onClick={generateTasks}
              disabled={isGenerating || !feedbackText.trim()}
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <h3 className="text-lg font-semibold text-foreground">Generated Tasks</h3>
                <button
                  onClick={addTasksToProject}
                  disabled={isGenerating}
                  className="bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add {generatedTasks.length} Tasks
                </button>
              </div>

              <div className="space-y-3">
                {generatedTasks.map((task, index) => (
                  <div key={index} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-foreground">{task.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-foreground-dim text-sm mb-3">{task.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                      {task.estimated_hours && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {task.estimated_hours}h
                        </span>
                      )}
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