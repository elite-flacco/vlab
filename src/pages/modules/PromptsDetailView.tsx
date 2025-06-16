import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Search, Copy, Star, Play, ArrowLeft, Edit3, Save, X, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/supabase';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';

interface PromptItem {
  id: string;
  project_id: string;
  name: string;
  description: string;
  content: string;
  variables: any[];
  version: number;
  is_template: boolean;
  category: string;
  tags: string[];
  usage_count: number;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export const PromptsDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isEditingList, setIsEditingList] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [newPrompt, setNewPrompt] = useState<Partial<PromptItem> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchPrompts(projectId);
    }
  }, [projectId]);

  const fetchPrompts = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await db.getPrompts(id);
      if (fetchError) throw fetchError;
      setPrompts(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const handleUpdatePrompt = async (promptId: string, updates: Partial<PromptItem>) => {
    setSaving(true);
    setError(null);

    try {
      const { data, error: updateError } = await db.updatePrompt(promptId, updates);
      if (updateError) throw updateError;

      // Update local state
      const updatedPrompts = prompts.map(prompt =>
        prompt.id === promptId ? data : prompt
      );
      setPrompts(updatedPrompts);
      setEditingPromptId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePrompt = async (promptData: Partial<PromptItem>) => {
    if (!projectId) return;

    setSaving(true);
    setError(null);

    try {
      const newPromptData = {
        project_id: projectId,
        name: promptData.name || 'New Prompt',
        description: promptData.description || '',
        content: promptData.content || '',
        variables: promptData.variables || [],
        version: 1,
        is_template: promptData.is_template || false,
        category: promptData.category || 'general',
        tags: promptData.tags || [],
        usage_count: 0,
      };

      const { data, error: createError } = await db.createPrompt(newPromptData);
      if (createError) throw createError;

      // Add to local state
      setPrompts(prev => [data, ...prev]);
      setNewPrompt(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    setSaving(true);
    setError(null);

    try {
      const { error: deleteError } = await db.deletePrompt(promptId);
      if (deleteError) throw deleteError;

      // Remove from local state
      setPrompts(prev => prev.filter(prompt => prompt.id !== promptId));
      setEditingPromptId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPrompt = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const categories = Array.from(new Set(prompts.map(prompt => prompt.category)));

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatTagsInput = (tags: string[]) => tags.join(', ');
  const parseTagsInput = (input: string) =>
    input.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

  const categoryOptions = [
    'general',
    'development',
    'design',
    'research',
    'marketing',
    'documentation',
    'testing',
    'planning',
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleReturnToWorkspace}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Workspace
          </button>
        </div>
        <ModuleContainer title="Prompts" type="prompts">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading prompts...</p>
            </div>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleReturnToWorkspace}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Workspace
          </button>
        </div>
        <ModuleContainer title="Prompts" type="prompts">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  if (prompts.length === 0 && !isEditingList) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleReturnToWorkspace}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Workspace
          </button>
        </div>
        <ModuleContainer title="Prompts" type="prompts">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Prompts Yet</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Create AI prompts to streamline your development workflow.
              </p>
            </div>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={handleReturnToWorkspace}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Workspace
        </button>
      </div>

      <ModuleContainer title="Prompts" type="prompts">
        <div className="h-full flex flex-col">
          {/* Header */}
          {!newPrompt && (
              <button
                onClick={() => {
                  setIsEditingList(true);
                  setNewPrompt({
                    name: '',
                    description: '',
                    content: '',
                    category: 'general',
                    tags: [],
                    is_template: false,
                  });
                }}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-2 text-sm mb-4"
                data-component-name="PromptsDetailView"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Prompt</span>
              </button>
          )}
          {/* New Prompt Form */}
          {newPrompt && (
            <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4 mb-3">
              <h4 className="font-medium text-blue-900 mb-3">Add New Prompt</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={newPrompt.name || ''}
                      onChange={(e) => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                      placeholder="Prompt name"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={newPrompt.category || 'general'}
                      onChange={(e) => setNewPrompt(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newPrompt.description || ''}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Brief description of the prompt"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={newPrompt.content || ''}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono resize-none"
                    rows={6}
                    placeholder="Enter your prompt content here..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formatTagsInput(newPrompt.tags || [])}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, tags: parseTagsInput(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="ai, coding, documentation"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newPrompt.is_template || false}
                      onChange={(e) => setNewPrompt(prev => ({ ...prev, is_template: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Mark as template</span>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCreatePrompt(newPrompt)}
                    disabled={saving || !newPrompt.name?.trim() || !newPrompt.content?.trim()}
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
                        Create Prompt
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setNewPrompt(null)}
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

          <div className="flex items-center space-x-3">
            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="flex items-center space-x-2 mb-4 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${!selectedCategory
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${selectedCategory === category
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search prompts..."
                className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          {/* Prompts List */}
          <div className="flex-1 overflow-y-auto space-y-3">

            {filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                {editingPromptId === prompt.id ? (
                  // Edit Form
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={prompt.name}
                          onChange={(e) => {
                            const updatedPrompts = prompts.map(p =>
                              p.id === prompt.id ? { ...p, name: e.target.value } : p
                            );
                            setPrompts(updatedPrompts);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium"
                          placeholder="Prompt name"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                        <select
                          value={prompt.category}
                          onChange={(e) => {
                            const updatedPrompts = prompts.map(p =>
                              p.id === prompt.id ? { ...p, category: e.target.value } : p
                            );
                            setPrompts(updatedPrompts);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        >
                          {categoryOptions.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={prompt.description}
                        onChange={(e) => {
                          const updatedPrompts = prompts.map(p =>
                            p.id === prompt.id ? { ...p, description: e.target.value } : p
                          );
                          setPrompts(updatedPrompts);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        placeholder="Brief description of the prompt"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
                      <textarea
                        value={prompt.content}
                        onChange={(e) => {
                          const updatedPrompts = prompts.map(p =>
                            p.id === prompt.id ? { ...p, content: e.target.value } : p
                          );
                          setPrompts(updatedPrompts);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-mono resize-none"
                        rows={6}
                        placeholder="Enter your prompt content here..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={formatTagsInput(prompt.tags)}
                        onChange={(e) => {
                          const updatedPrompts = prompts.map(p =>
                            p.id === prompt.id ? { ...p, tags: parseTagsInput(e.target.value) } : p
                          );
                          setPrompts(updatedPrompts);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        placeholder="ai, coding, documentation"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={prompt.is_template}
                          onChange={(e) => {
                            const updatedPrompts = prompts.map(p =>
                              p.id === prompt.id ? { ...p, is_template: e.target.checked } : p
                            );
                            setPrompts(updatedPrompts);
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-gray-700">Mark as template</span>
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdatePrompt(prompt.id, prompt)}
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
                        onClick={() => setEditingPromptId(null)}
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{prompt.name}</h4>
                        {prompt.is_template && (
                          <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>

                      {prompt.description && (
                        <p className="text-xs text-gray-600 mt-1 truncate">{prompt.description}</p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {prompt.category}
                        </span>
                        {prompt.tags && prompt.tags.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {prompt.tags[0]}{prompt.tags.length > 1 ? ` +${prompt.tags.length - 1}` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ml-2 flex items-center space-x-1">
                      <button
                        onClick={() => handleCopyPrompt(prompt.content)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy prompt"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingPromptId(prompt.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit prompt"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePrompt(prompt.id)}
                        disabled={saving}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete prompt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {filteredPrompts.length} of {prompts.length} prompts
            </div>
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};