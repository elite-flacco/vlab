import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';
import { BackButton } from '../../components/common/BackButton';
import { Palette, Sparkles, Zap, Layers, PenTool, Loader2, CheckCircle2, AlertCircle, Plus, Check, Edit2, Save, X, Upload, Image, FileText, Trash2, Tag } from 'lucide-react';
import { db, supabase } from '../../lib/supabase';
import { generateDesignTasks, generateDesignTasksFromImage } from '../../lib/openai';
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
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'description' | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'text' | 'image'>('image');
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReturnToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const generateTasks = async () => {
    if (analysisMode === 'text' && !feedbackText.trim()) {
      setError('Please enter some design feedback text');
      return;
    }

    if (analysisMode === 'image' && !uploadedImage) {
      setError('Please upload a screenshot to analyze');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      let tasks;
      if (analysisMode === 'text') {
        tasks = await generateDesignTasks(feedbackText);
      } else {
        // TODO: Implement image analysis
        tasks = await generateDesignTasksFromImage(uploadedImage!);
      }

      setGeneratedTasks(tasks);
      // Select all tasks by default
      setSelectedTaskIds(new Set(tasks.map((_, index) => index)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tasks');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    try {
      // Compress image to reduce payload size
      const compressedFile = await compressImage(file, 0.8, 1200); // 80% quality, max 1200px width

      // Create preview from original file for better quality display
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.onerror = (e) => {
        setError('Failed to create image preview');
      };
      reader.readAsDataURL(file);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    }
  };

  // Compress image to reduce API payload size
  const compressImage = (file: File, quality: number, maxWidth: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const img = document.createElement('img');

      img.onload = () => {
        try {
          // Calculate new dimensions
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
          const newWidth = img.width * ratio;
          const newHeight = img.height * ratio;

          // Set canvas size
          canvas.width = newWidth;
          canvas.height = newHeight;

          // Draw and compress
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (!imageFile) {
      setError('Please drop a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    try {
      // Compress image to reduce payload size
      const compressedFile = await compressImage(imageFile, 0.8, 1200);

      // Create preview from original file for better quality display
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.onerror = (e) => {
        setError('Failed to create image preview');
      };
      reader.readAsDataURL(imageFile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    }
  };


  const addTasksToProject = async () => {
    const selectedTasks = generatedTasks.filter((_, index) => selectedTaskIds.has(index));
    if (!projectId || selectedTasks.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to add tasks');
        return;
      }

      // Add each selected task to the database using the db helper
      for (const task of selectedTasks) {
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

      setSuccess(`Successfully added ${selectedTasks.length} tasks to your project!`);
      setGeneratedTasks([]);
      setSelectedTaskIds(new Set());
      setFeedbackText('');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tasks');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTaskSelection = (taskIndex: number) => {
    const newSelection = new Set(selectedTaskIds);
    if (newSelection.has(taskIndex)) {
      newSelection.delete(taskIndex);
    } else {
      newSelection.add(taskIndex);
    }
    setSelectedTaskIds(newSelection);
  };

  const toggleAllTasks = () => {
    if (selectedTaskIds.size === generatedTasks.length) {
      // If all are selected, deselect all
      setSelectedTaskIds(new Set());
    } else {
      // Otherwise, select all
      setSelectedTaskIds(new Set(generatedTasks.map((_, index) => index)));
    }
  };

  const updateTask = (taskIndex: number, field: keyof GeneratedTask, value: any) => {
    const updatedTasks = [...generatedTasks];
    updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], [field]: value };
    setGeneratedTasks(updatedTasks);
  };

  const startEditing = (taskIndex: number, field: 'title' | 'description') => {
    setEditingTaskId(taskIndex);
    setEditingField(field);
  };

  const stopEditing = () => {
    setEditingTaskId(null);
    setEditingField(null);
  };

  const isEditing = (taskIndex: number, field: 'title' | 'description') => {
    return editingTaskId === taskIndex && editingField === field;
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
              Get feedback on your UI/UX design and automatically generate tasks
            </p>
          </div>

          {/* Analysis Mode Switcher */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex bg-background border border-border rounded-lg p-1">
              <button
                onClick={() => setAnalysisMode('image')}
                className={`flex items-center gap-2 px-4 py-2 text-base rounded-md transition-all ${analysisMode === 'image'
                  ? 'filter-button-active'
                  : 'filter-button'
                  }`}
              >
                <Image className="w-4 h-4" />
                Upload Screenshot
              </button>
              <button
                onClick={() => setAnalysisMode('text')}
                className={`flex items-center gap-2 px-4 py-2 text-base rounded-md transition-all ${analysisMode === 'text'
                  ? 'filter-button-active'
                  : 'filter-button'
                  }`}
              >
                <FileText className="w-4 h-4" />
                Paste Text
              </button>

            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            {analysisMode === 'text' ? (
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-foreground mb-2">
                  Design Feedback
                </label>
                <textarea
                  id="feedback"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="If you want to use your preferred AI tools, you can simply paste the feedback here... For example: 'The header feels too cramped on mobile. The call-to-action button needs more contrast. The navigation could be more intuitive.'"
                  className="form-textarea min-h-[8rem]"
                  disabled={isGenerating}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Upload Screenshot
                </label>

                {!imagePreview ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${isDragOver
                      ? 'border-primary bg-primary/5 scale-105'
                      : 'border-border hover:border-primary/50'
                      }`}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={isGenerating}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block">
                      <Upload className={`w-10 h-10 mx-auto mb-4 transition-colors ${isDragOver ? 'text-primary' : 'text-foreground-dim'
                        }`} />
                      <p className={`mb-2 transition-colors ${isDragOver ? 'text-primary font-medium' : 'text-foreground-dim'
                        }`}>
                        {isDragOver ? 'Drop your screenshot here!' : 'Click to upload a screenshot or drag and drop'}
                      </p>
                      <p className="text-sm text-foreground-dim/70">
                        PNG, JPG, or WebP up to 10MB
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Uploaded screenshot"
                      className="w-full max-h-64 p-4 object-contain rounded-lg border border-border"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      disabled={isGenerating}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {/* {uploadedImage && (
                      <div className="mt-2 text-sm text-foreground-dim">
                        Compressed: {(uploadedImage.size / 1024).toFixed(1)}KB
                      </div>
                    )} */}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={generateTasks}
              disabled={
                isGenerating ||
                (analysisMode === 'text' && !feedbackText.trim()) ||
                (analysisMode === 'image' && !uploadedImage)
              }
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating
                ? 'Analyzing...'
                : analysisMode === 'text'
                  ? 'Generate Tasks'
                  : 'Analyze Screenshot'
              }
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-destructive">{error}</span>
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
            <div className="space-y-4 mt-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3>Generated Tasks</h3>
                  <button
                    onClick={toggleAllTasks}
                    className={`${selectedTaskIds.size === generatedTasks.length
                      ? 'filter-button'
                      : 'filter-button-active'
                      }`}
                  >
                    {selectedTaskIds.size === generatedTasks.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <button
                  onClick={addTasksToProject}
                  disabled={isGenerating || selectedTaskIds.size === 0}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add {selectedTaskIds.size} Task{selectedTaskIds.size !== 1 ? 's' : ''}
                </button>
              </div>

              <div className="space-y-3">
                {generatedTasks.map((task, index) => (
                  <div key={index} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 pt-1">
                        <button
                          onClick={() => toggleTaskSelection(index)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${selectedTaskIds.has(index)
                            ? 'bg-background border-foreground/40 text-primary'
                            : 'border-foreground/40 hover:border-primary/50 bg-background'
                            }`}
                        >
                          {selectedTaskIds.has(index) && <Check className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Task Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 mr-3">
                            {isEditing(index, 'title') ? (
                              <input
                                type="text"
                                value={task.title}
                                onChange={(e) => updateTask(index, 'title', e.target.value)}
                                className="form-input"
                                onBlur={stopEditing}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') stopEditing();
                                  if (e.key === 'Escape') stopEditing();
                                }}
                                autoFocus
                              />
                            ) : (
                              <h4
                                className="text-base cursor-pointer hover:bg-background/50 rounded px-1 py-0.5 -mx-1 -my-0.5 transition-colors"
                                onClick={() => startEditing(index, 'title')}
                              >
                                {task.title}
                              </h4>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => editingTaskId === index ? stopEditing() : startEditing(index, 'title')}
                              className="p-1 text-foreground-dim hover:text-foreground transition-colors"
                              title={editingTaskId === index ? "Stop editing" : "Edit task"}
                            >
                              {editingTaskId === index ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                            </button>
                            <select
                              value={task.priority}
                              onChange={(e) => updateTask(index, 'priority', e.target.value)}
                              className={`badge ${getPriorityBadgeClass(task.priority)} appearance-none cursor-pointer border-none outline-none`}
                            >
                              <option value="low" style={{ backgroundColor: '#1a1a1a', color: '#e0e0e0' }}>low</option>
                              <option value="medium" style={{ backgroundColor: '#1a1a1a', color: '#e0e0e0' }}>medium</option>
                              <option value="high" style={{ backgroundColor: '#1a1a1a', color: '#e0e0e0' }}>high</option>
                              <option value="highest" style={{ backgroundColor: '#1a1a1a', color: '#e0e0e0' }}>highest</option>
                            </select>
                          </div>
                        </div>

                        {isEditing(index, 'description') ? (
                          <textarea
                            value={task.description}
                            onChange={(e) => updateTask(index, 'description', e.target.value)}
                            className="form-textarea"
                            rows={3}
                            onBlur={stopEditing}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') stopEditing();
                            }}
                            autoFocus
                          />
                        ) : (
                          <p
                            className="text-foreground-dim text-sm mb-3 cursor-pointer hover:bg-background/50 rounded px-1 py-0.5 -mx-1 -my-0.5 transition-colors"
                            onClick={() => startEditing(index, 'description')}
                          >
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Tag className="w-3 h-3 text-foreground-dim" />
                              <span className="text-xs text-foreground-dim">
                                {task.tags.slice(0, 2).join(', ')}
                                {task.tags.length > 2 && ` +${task.tags.length - 2}`}
                              </span>
                            </div>
                          )}
                          {/* {task.estimated_hours && (
                            <span 
                              className="px-2 py-1 bg-secondary/50 text-foreground-dim rounded-full text-xs cursor-pointer hover:bg-secondary/70 transition-colors"
                              onClick={() => {
                                const hours = prompt('Enter estimated hours:', task.estimated_hours?.toString() || '');
                                if (hours !== null) {
                                  const parsedHours = parseFloat(hours);
                                  if (!isNaN(parsedHours) && parsedHours > 0) {
                                    updateTask(index, 'estimated_hours', parsedHours);
                                  } else if (hours === '' || hours === '0') {
                                    updateTask(index, 'estimated_hours', null);
                                  }
                                }
                              }}
                              title="Click to edit estimated hours"
                            >
                              {task.estimated_hours}h
                            </span>
                          )} */}
                        </div>
                      </div>
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