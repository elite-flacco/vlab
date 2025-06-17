import { format } from 'date-fns';
import { CheckSquare, Edit3, Loader2, Plus, Save, Search, Square, Tag, Trash2, X } from 'lucide-react';
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

  const filteredTasks = tasks
    .filter(task => {
      const matchesStatus = filter === 'all'
        ? (showCompleted || task.status !== 'done')
        : task.status === filter;

      const matchesSearch = searchTerm === '' ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      // First sort by priority (urgent > high > medium > low)
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 3;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 3;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If priorities are the same, sort by position
      return a.position - b.position;
    });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
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
          <div className="h-full flex items-center justify-center py-12">
            <div className="text-center">
              <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Yet</h3>
              <p className="text-gray-600 mb-4 text-sm">
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
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
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
          <div className="space-y-3 mb-4">
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
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-2 text-sm mb-4"
                data-component-name="TasksDetailView"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Task</span>
              </button>
            )}
            {/* New Task Form - Shows when newTask is set */}
            {newTask && (
              <div className="bg-white border border-orange-200 rounded-lg p-4 shadow-sm">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      placeholder="Enter task title"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      rows={3}
                      placeholder="Enter task description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={newTask.status}
                        onChange={(e) => setNewTask({ ...newTask, status: e.target.value as any })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={newTask.tags ? newTask.tags.join(', ') : ''}
                      onChange={(e) => setNewTask({ ...newTask, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      placeholder="frontend, backend, design"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAddTask(newTask)}
                      disabled={saving || !newTask.title?.trim()}
                      className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
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
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">All Tasks</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Completed</option>
                </select>
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${showCompleted
                    ? 'bg-orange-100 text-orange-800'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {showCompleted ? 'Hide' : 'Show'} Completed
                </button>
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto space-y-2">

            {/* Existing Tasks */}
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all ${task.status === 'done' ? 'opacity-75' : ''
                  }`}
              >
                {editingTaskId === task.id ? (
                  // Edit Form
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => {
                          const updatedTasks = tasks.map(t =>
                            t.id === task.id ? { ...t, title: e.target.value } : t
                          );
                          setTasks(updatedTasks);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        placeholder="Task title"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={task.description}
                        onChange={(e) => {
                          const updatedTasks = tasks.map(t =>
                            t.id === task.id ? { ...t, description: e.target.value } : t
                          );
                          setTasks(updatedTasks);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-none"
                        rows={2}
                        placeholder="Task description..."
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={task.status}
                          onChange={(e) => {
                            const updatedTasks = tasks.map(t =>
                              t.id === task.id ? { ...t, status: e.target.value as any } : t
                            );
                            setTasks(updatedTasks);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          value={task.priority}
                          onChange={(e) => {
                            const updatedTasks = tasks.map(t =>
                              t.id === task.id ? { ...t, priority: e.target.value as any } : t
                            );
                            setTasks(updatedTasks);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                        <input
                          type="date"
                          value={task.due_date ? task.due_date.split('T')[0] : ''}
                          onChange={(e) => {
                            const updatedTasks = tasks.map(t =>
                              t.id === task.id ? { ...t, due_date: e.target.value || undefined } : t
                            );
                            setTasks(updatedTasks);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={formatTagsInput(task.tags)}
                        onChange={(e) => {
                          const updatedTasks = tasks.map(t =>
                            t.id === task.id ? { ...t, tags: parseTagsInput(e.target.value) } : t
                          );
                          setTasks(updatedTasks);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        placeholder="frontend, backend, design"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateTask(task.id, task)}
                        disabled={saving}
                        className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
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
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex items-start space-x-3">
                    <button
                      className="mt-0.5 flex-shrink-0"
                      onClick={() => handleToggleTaskCompletion(task.id, task.status)}
                      disabled={saving}
                    >
                      {getStatusIcon(task.status)}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center space-x-2 ml-2">
                          {/* Interactive Priority Dropdown */}
                          <select
                            value={task.priority}
                            onChange={(e) => handlePriorityChange(task.id, e.target.value)}
                            disabled={saving}
                            className={`appearance-none cursor-pointer px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getPriorityColor(task.priority)} disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1`}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setEditingTaskId(task.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Edit task"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              disabled={saving}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Delete task"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{task.description}</p>
                      )}

                      <div className="flex items-center flex-wrap gap-2 mt-2">
                        {task.due_date && (
                          <span className="text-xs text-gray-500">
                            Due {format(new Date(task.due_date), 'MMM d')}
                          </span>
                        )}

                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Tag className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
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