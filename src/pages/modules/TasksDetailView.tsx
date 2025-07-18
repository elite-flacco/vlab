import { format } from 'date-fns';
import { ArrowDown, ArrowUp, CheckSquare, Edit3, Loader2, Minus, Plus, Save, Search, Square, Tag, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackButton } from '../../components/common/BackButton';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';
import { db } from '../../lib/supabase';

interface TaskItem {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  tags: string[];
  dependencies: string[];
  assignee_id?: string;
  parent_task_id?: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export const TasksDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<Partial<TaskItem> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    }
  }, [projectId]);

  const fetchTasks = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await db.getTasks(id);
      if (fetchError) throw fetchError;
      setTasks(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<TaskItem>) => {
    setSaving(true);
    setError(null);

    try {
      const { data, error: updateError } = await db.updateTask(taskId, updates);
      if (updateError) throw updateError;

      // Update local state
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? data : task
      );
      setTasks(updatedTasks);
      setEditingTaskId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async (taskData: Partial<TaskItem>) => {
    if (!projectId) return;

    setSaving(true);
    setError(null);

    try {
      const newTaskData = {
        project_id: projectId,
        title: taskData.title || 'New Task',
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date,
        tags: taskData.tags || [],
        dependencies: taskData.dependencies || [],
        position: tasks.length,
      };

      const { data, error: createError } = await db.createTask(newTaskData);
      if (createError) throw createError;

      // Add to local state
      setTasks(prev => [...prev, data]);
      setNewTask(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setSaving(true);
    setError(null);

    try {
      const { error: deleteError } = await db.deleteTask(taskId);
      if (deleteError) throw deleteError;

      // Remove from local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
      setEditingTaskId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTaskCompletion = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    await handleUpdateTask(taskId, { status: newStatus });
  };

  const handlePriorityChange = async (taskId: string, newPriority: string) => {
    await handleUpdateTask(taskId, { priority: newPriority as TaskItem['priority'] });
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await handleUpdateTask(taskId, { status: newStatus as TaskItem['status'] });
  };

  const filteredTasks = tasks
    .filter(task => {
      const matchesStatus = filter === 'all'
        ? (showCompleted || task.status !== 'done')
        : task.status === filter;

      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      const matchesSearch = searchTerm === '' ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesStatus && matchesPriority && matchesSearch;
    })
    .sort((a, b) => {
      // First sort by priority (urgent > high > medium > low)
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder];
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder];

      // Handle undefined priorities (fallback to low)
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
      case 'urgent': return 'badge-priority-urgent';   // Red for critical/urgent
      case 'high': return 'badge-priority-high';       // Orange for high
      case 'medium': return 'badge-priority-medium';   // Yellow for medium  
      default: return 'badge-success';                 // Green for low
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <ArrowUp className="w-3 h-3" />;     // Up arrow for urgent
      case 'high': return <ArrowUp className="w-3 h-3" />;       // Up arrow for high
      case 'medium': return <Minus className="w-3 h-3" />;       // Dash for medium
      default: return <ArrowDown className="w-3 h-3" />;         // Down arrow for low
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'badge-secondary';   // Gray for to-do
      case 'in_progress': return 'badge-info'; // Blue for in progress
      case 'done': return 'badge-success';     // Green for completed
      case 'blocked': return 'badge-danger';   // Red for blocked
      default: return 'badge-secondary';
    }
  };


  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'done': return 'Done';
      case 'blocked': return 'Blocked';
      default: return status;
    }
  };

  const getStatusIcon = (status: string, completed: boolean = false) => {
    if (status === 'done' || completed) {
      return <CheckSquare className="w-4 h-4 text-green-600" />;
    }
    return <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />;
  };

  const formatTagsInput = (tags: string[]) => tags.join(', ');
  const parseTagsInput = (input: string) =>
    input.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Tasks" type="tasks">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="loading-spinner"></div>
              <p className="mt-4 text-gray-600">Loading tasks...</p>
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
        <ModuleContainer title="Tasks" type="tasks">
          <div className="card bg-red-50 border-red-200 p-4">
            <p className="card-content text-red-600">{error}</p>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  if (tasks.length === 0 && !newTask) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Tasks" type="tasks">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <CheckSquare className="w-12 h-12 text-foreground-dim/50 mx-auto mb-4" />
              <h3 className="card-title mb-2">No Tasks Yet</h3>
              <p className="card-content mb-4">
                Create tasks to track your development progress.
              </p>
              <button
                onClick={() => setNewTask({
                  title: '',
                  description: '',
                  status: 'todo',
                  priority: 'medium',
                  tags: [],
                  dependencies: [],
                })}
                className="btn-add mb-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </button>
            </div>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <BackButton onClick={handleReturnToWorkspace} />
      <ModuleContainer title="Tasks" type="tasks">
        <div className="h-full flex flex-col">
          {/* Header and Search */}
          {/* Add New Task Button - Always visible at the top */}
          {!newTask && (
            <button
              onClick={() => setNewTask({
                title: '',
                description: '',
                status: 'todo',
                priority: 'medium',
                tags: [],
                dependencies: [],
                position: tasks.length
              })}
              className="btn-add mb-6"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Task</span>
            </button>
          )}
          {/* New Task Form - Shows when newTask is set */}
          {newTask && (
            <div className="card p-6 mb-6">
              <div className="card-header">
                <h4 className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Task
                </h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Task Title</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="form-input"
                    placeholder="Enter task title"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="form-textarea"
                    rows={3}
                    placeholder="Enter task description"
                  />
                </div>

                <div className="flex space-x-3 items-start">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                      className="form-select"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={newTask.tags ? newTask.tags.join(', ') : ''}
                      onChange={(e) => setNewTask({ ...newTask, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) })}
                      className="form-input"
                      placeholder="frontend, backend, design"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAddTask(newTask)}
                    disabled={saving || !newTask.title?.trim()}
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
                        Create Task
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setNewTask(null)}
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
          <div className="card p-4 mb-6">
            <div className="flex items-center space-x-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="search-icon" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tasks..."
                  className="search-input"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="form-select"
              >
                <option value="all">All Tasks</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Completed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="form-select"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className={`${showCompleted
                  ? 'filter-button-active'
                  : 'filter-button'
                  }`}
              >
                {showCompleted ? 'Hide' : 'Show'} Completed
              </button>
            </div>

          </div>

          {/* Tasks List */}
          <div className="flex-1 space-y-3">

            {/* Existing Tasks */}
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`card ${task.status === 'done' ? 'opacity-75' : ''}`}
              >
                {editingTaskId === task.id ? (
                  // Edit Form
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Title</label>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => {
                          const updatedTasks = tasks.map(t =>
                            t.id === task.id ? { ...t, title: e.target.value } : t
                          );
                          setTasks(updatedTasks);
                        }}
                        className="form-input"
                        placeholder="Task title"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Description</label>
                      <textarea
                        value={task.description}
                        onChange={(e) => {
                          const updatedTasks = tasks.map(t =>
                            t.id === task.id ? { ...t, description: e.target.value } : t
                          );
                          setTasks(updatedTasks);
                        }}
                        className="form-textarea"
                        rows={2}
                        placeholder="Task description..."
                      />
                    </div>

                    <div className="flex space-x-3 items-start">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Status</label>
                        <select
                          value={task.status}
                          onChange={(e) => {
                            const updatedTasks = tasks.map(t =>
                              t.id === task.id ? { ...t, status: e.target.value as any } : t
                            );
                            setTasks(updatedTasks);
                          }}
                          className="form-select"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Priority</label>
                        <select
                          value={task.priority}
                          onChange={(e) => {
                            const updatedTasks = tasks.map(t =>
                              t.id === task.id ? { ...t, priority: e.target.value as any } : t
                            );
                            setTasks(updatedTasks);
                          }}
                          className="form-select"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Tags (comma-separated)</label>
                        <input
                          type="text"
                          value={formatTagsInput(task.tags)}
                          onChange={(e) => {
                            const updatedTasks = tasks.map(t =>
                              t.id === task.id ? { ...t, tags: parseTagsInput(e.target.value) } : t
                            );
                            setTasks(updatedTasks);
                          }}
                          className="form-input"
                          placeholder="frontend, backend, design"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateTask(task.id, task)}
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
                        onClick={() => setEditingTaskId(null)}
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
                      onClick={() => handleToggleTaskCompletion(task.id, task.status)}
                      disabled={saving}
                    >
                      {getStatusIcon(task.status)}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className={`text-sm ${task.status === 'done' ? 'line-through text-foreground-dim' : 'text-foreground'}`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center space-x-2 ml-2">
                          {/* Interactive Status Dropdown */}
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            disabled={saving}
                            className={`appearance-none cursor-pointer ${getStatusColor(task.status)} disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1`}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                            <option value="blocked">Blocked</option>
                          </select>
                          {/* Interactive Priority Dropdown */}
                          <div className="relative">
                            <select
                              value={task.priority}
                              onChange={(e) => handlePriorityChange(task.id, e.target.value)}
                              disabled={saving}
                              className={`appearance-none cursor-pointer ${getPriorityColor(task.priority)} disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 pl-7 pr-4`}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-current">
                              {getPriorityIcon(task.priority)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingTaskId(task.id)}
                              className="p-1.5 text-foreground-dim hover:text-primary hover:bg-foreground-dim/10 rounded-lg transition-colorss"
                              title="Edit task"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              disabled={saving}
                              className="p-1 text-foreground-dim hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Delete task"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {task.description && (
                        <p className="card-content mt-1 text-sm">{task.description}</p>
                      )}

                      <div className="flex items-center flex-wrap gap-2 mt-2">
                        {task.due_date && (
                          <span className="text-xs text-foreground-dim">
                            Due {format(new Date(task.due_date), 'MMM d')}
                          </span>
                        )}

                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Tag className="w-3 h-3 text-foreground-dim" />
                            <span className="text-xs text-foreground-dim">
                              {task.tags.slice(0, 2).join(', ')}
                              {task.tags.length > 2 && ` +${task.tags.length - 2}`}
                            </span>
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
              {tasks.filter(t => t.status !== 'done').length} active • {tasks.filter(t => t.status === 'done').length} completed
            </div>
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};