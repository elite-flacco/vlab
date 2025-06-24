import { Copy, Edit3, Loader2, MessageSquare, Plus, Save, Search, Star, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// import { toast } from 'react-toastify';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';
import { BackButton } from '../../components/common/BackButton';
import { db } from '../../lib/supabase';

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
      // toast.success('Prompt copied to clipboard');
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
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Prompts" type="prompts">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="loading-spinner"></div>
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
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Prompts" type="prompts">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  if (prompts.length === 0 && !newPrompt) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Prompts" type="prompts">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Prompts Yet</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Create AI prompts to streamline your development workflow.
              </p>
              <button
                onClick={() => setNewPrompt({
                  name: '',
                  description: '',
                  category: 'general',
                  content: '',
                  tags: [],
                  is_template: false,
                })}
                className="btn-add mb-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Prompt
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
              className="btn-add mb-6"
              data-component-name="PromptsDetailView"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Prompt</span>
            </button>
          )}
          {/* New Prompt Form */}
          {newPrompt && (
            <div className="card p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="card-title flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Prompt
                </h4>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                    <input
                      type="text"
                      value={newPrompt.name || ''}
                      onChange={(e) => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input"
                      placeholder="Prompt name"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Category</label>
                    <select
                      value={newPrompt.category || 'general'}
                      onChange={(e) => setNewPrompt(prev => ({ ...prev, category: e.target.value }))}
                      className="form-select"
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
                  <label className="block text-xs font-medium text-foreground mb-1">Description</label>
                  <input
                    type="text"
                    value={newPrompt.description || ''}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, description: e.target.value }))}
                    className="form-input"
                    placeholder="Brief description of the prompt"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Content</label>
                  <textarea
                    value={newPrompt.content || ''}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, content: e.target.value }))}
                    className="form-textarea"
                    rows={6}
                    placeholder="Enter your prompt content here..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formatTagsInput(newPrompt.tags || [])}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, tags: parseTagsInput(e.target.value) }))}
                    className="form-input"
                    placeholder="ai, coding, documentation"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newPrompt.is_template || false}
                      onChange={(e) => setNewPrompt(prev => ({ ...prev, is_template: e.target.checked }))}
                      className="rounded border-foreground-dim/20"
                    />
                    <span className="text-foreground">Mark as template</span>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCreatePrompt(newPrompt)}
                    disabled={saving || !newPrompt.name?.trim() || !newPrompt.content?.trim()}
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
                        Create Prompt
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setNewPrompt(null)}
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

          {!newPrompt && (
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <Search className="search-icon" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search prompts..."
                  className="search-input"
                />
              </div>
              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="flex items-center space-x-2 overflow-x-auto">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`${!selectedCategory
                      ? 'filter-button-active'
                      : 'filter-button'
                      }`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`${selectedCategory === category
                        ? 'filter-button-active'
                        : 'filter-button'
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Prompts List */}
          <div className="flex-1 overflow-y-auto space-y-3">

            {filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="card"
              >
                {editingPromptId === prompt.id ? (
                  // Edit Form
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                        <input
                          type="text"
                          value={prompt.name}
                          onChange={(e) => {
                            const updatedPrompts = prompts.map(p =>
                              p.id === prompt.id ? { ...p, name: e.target.value } : p
                            );
                            setPrompts(updatedPrompts);
                          }}
                          className="form-input"
                          placeholder="Prompt name"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Category</label>
                        <select
                          value={prompt.category}
                          onChange={(e) => {
                            const updatedPrompts = prompts.map(p =>
                              p.id === prompt.id ? { ...p, category: e.target.value } : p
                            );
                            setPrompts(updatedPrompts);
                          }}
                          className="form-select"
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
                      <label className="block text-xs font-medium text-foreground mb-1">Description</label>
                      <input
                        type="text"
                        value={prompt.description}
                        onChange={(e) => {
                          const updatedPrompts = prompts.map(p =>
                            p.id === prompt.id ? { ...p, description: e.target.value } : p
                          );
                          setPrompts(updatedPrompts);
                        }}
                        className="form-input"
                        placeholder="Brief description of the prompt"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Content</label>
                      <textarea
                        value={prompt.content}
                        onChange={(e) => {
                          const updatedPrompts = prompts.map(p =>
                            p.id === prompt.id ? { ...p, content: e.target.value } : p
                          );
                          setPrompts(updatedPrompts);
                        }}
                        className="form-textarea"
                        rows={6}
                        placeholder="Enter your prompt content here..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={formatTagsInput(prompt.tags)}
                        onChange={(e) => {
                          const updatedPrompts = prompts.map(p =>
                            p.id === prompt.id ? { ...p, tags: parseTagsInput(e.target.value) } : p
                          );
                          setPrompts(updatedPrompts);
                        }}
                        className="form-input"
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
                          className="rounded border-foreground-dim/20 text-primary focus:ring-1"
                        />
                        <span className="text-foreground">Mark as template</span>
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdatePrompt(prompt.id, prompt)}
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
                        onClick={() => setEditingPromptId(null)}
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm text-foreground truncate">{prompt.name}</h4>
                        {prompt.is_template && (
                          <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>

                      {prompt.description && (
                        <p className="text-xs text-foreground-dim mt-1 truncate">{prompt.description}</p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {prompt.category}
                        </span>
                        {prompt.tags && prompt.tags.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-foreground-dim/10 text-foreground-dim">
                            {prompt.tags[0]}{prompt.tags.length > 1 ? ` +${prompt.tags.length - 1}` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ml-2 flex items-center space-x-1">
                      <button
                        onClick={() => handleCopyPrompt(prompt.content)}
                        className="p-1.5 text-foreground-dim hover:text-foreground hover:bg-foreground-dim/10 rounded-lg transition-colors"
                        title="Copy prompt"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingPromptId(prompt.id)}
                        className="p-1 text-foreground-dim hover:text-primary hover:bg-foreground-dim/10 rounded-lg transition-colors"
                        title="Edit prompt"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeletePrompt(prompt.id)}
                        disabled={saving}
                        className="p-1.5 text-foreground-dim hover:text-red-600 hover:bg-foreground-dim/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete prompt"
                      >
                        <Trash2 className="w-3 h-3" />
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