import { format } from 'date-fns';
import { AlertCircle, Check, CheckCircle2, ChevronDown, ChevronUp, Edit3, Loader2, Pin, Plus, Save, Search, Sparkles, StickyNote, Tag, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';
import { BackButton } from '../../components/common/BackButton';
import { MarkdownRenderer, useMarkdownPreprocessing } from '../../components/common/MarkdownRenderer';
import { generateDesignTasks } from '../../lib/openai';
import { db, supabase } from '../../lib/supabase';

interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

interface ScratchpadNote {
  id: string;
  project_id: string;
  title: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  font_size: number;
  is_pinned: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

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

// Define tag options as specified
const TAG_OPTIONS = [
  'Project Notes',
  'Ideas',
  'Links & Resources',
  'AI Discussion'
];

// Use consistent tag styling across all modules
const getTagClass = () => 'badge-tag';

export const ScratchpadDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<ScratchpadNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<Partial<ScratchpadNote> | null>(null);
  const [saving, setSaving] = useState(false);
  const { processContent } = useMarkdownPreprocessing();

  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Task generation state
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [selectedNoteForTasks, setSelectedNoteForTasks] = useState<string | null>(null);
  const [taskSuccess, setTaskSuccess] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchNotes(projectId);
    }
  }, [projectId]);

  const fetchNotes = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await db.getScratchpadNotes(id) as DatabaseResponse<ScratchpadNote[]>;
      if (response.error) throw response.error;
      setNotes(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const handleUpdateNote = async (noteId: string, updates: Partial<ScratchpadNote>) => {
    setSaving(true);
    setError(null);

    try {
      const response = await db.updateScratchpadNote(noteId, updates) as DatabaseResponse<ScratchpadNote>;
      if (response.error) throw response.error;

      // Update local state
      const updatedNotes = notes.map(note =>
        note.id === noteId ? { ...note, ...updates } : note
      );
      setNotes(updatedNotes);
      setEditingNoteId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update note');
    } finally {
      setSaving(false);
    }
  };

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes(prev => ({
      ...prev,
      [noteId]: !prev[noteId]
    }));
  };

  const handleCreateNote = async (noteData: Partial<ScratchpadNote>) => {
    if (!projectId) return;

    setSaving(true);
    setError(null);

    try {
      const newNoteData = {
        project_id: projectId,
        title: noteData.title || '',
        content: noteData.content || 'New note',
        position: noteData.position || { x: 0, y: 0 },
        size: noteData.size || { width: 300, height: 200 },
        color: noteData.color || '#fef3c7',
        font_size: noteData.font_size || 14,
        is_pinned: noteData.is_pinned || false,
        tags: noteData.tags || [],
      };

      const response = await db.createScratchpadNote(newNoteData) as DatabaseResponse<ScratchpadNote>;
      if (response.error) throw response.error;

      // Add to local state
      setNotes(prev => response.data ? [response.data, ...prev] : prev);
      setNewNote(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create note');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setSaving(true);
    setError(null);

    try {
      const response = await db.deleteScratchpadNote(noteId) as DatabaseResponse<void>;
      if (response.error) throw response.error;

      // Remove from local state
      setNotes(prev => prev.filter(note => note.id !== noteId));
      setEditingNoteId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete note');
    } finally {
      setSaving(false);
    }
  };

  // Task generation functions
  const generateTasksFromNote = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.content.trim()) {
      setTaskError('Please select a note with content to generate tasks from');
      return;
    }

    setIsGeneratingTasks(true);
    setTaskError(null);
    setTaskSuccess(null);
    setSelectedNoteForTasks(noteId);

    try {
      const tasks = await generateDesignTasks(note.content);
      setGeneratedTasks(tasks);
      // Select all tasks by default
      setSelectedTaskIds(new Set(tasks.map((_, index) => index)));
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : 'Failed to generate tasks');
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const addTasksToProject = async () => {
    const selectedTasks = generatedTasks.filter((_, index) => selectedTaskIds.has(index));
    if (!projectId || selectedTasks.length === 0) return;

    setIsGeneratingTasks(true);
    setTaskError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTaskError('You must be logged in to add tasks');
        return;
      }

      // Add each selected task to the database
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

      setTaskSuccess(`Successfully added ${selectedTasks.length} tasks to your project!`);
      setGeneratedTasks([]);
      setSelectedTaskIds(new Set());
      setSelectedNoteForTasks(null);

    } catch (err) {
      setTaskError(err instanceof Error ? err.message : 'Failed to add tasks');
    } finally {
      setIsGeneratingTasks(false);
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
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(generatedTasks.map((_, index) => index)));
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'highest': return 'badge-priority-urgent';
      case 'high': return 'badge-priority-high';
      case 'medium': return 'badge-priority-medium';
      case 'low': return 'badge-priority-low';
      default: return 'badge-priority-low';
    }
  };

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags || [])));

  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = note.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = !selectedTag || (note.tags && note.tags.includes(selectedTag));
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      // Sort pinned notes first, then by most recently updated
      if (a.is_pinned === b.is_pinned) {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      return a.is_pinned ? -1 : 1;
    });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Scratchpad" type="scratchpad">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="loading-spinner"></div>
              <p className="mt-4 text-gray-600">Loading notes...</p>
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
        <ModuleContainer title="Scratchpad" type="scratchpad">
          <div className="card bg-red-50 border-red-200">
            <p className="card-content text-red-600">{error}</p>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  // No Notes Yet state - only show when there are no notes AND no new note form is active
  if (notes.length === 0 && !newNote) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Scratchpad" type="scratchpad">
          <div className="h-full flex items-center justify-center py-12">
            <div className="text-center">
              <StickyNote className="w-12 h-12 text-foreground-dim/50 mx-auto mb-4" />
              <h3 className="card-title mb-2">No Notes Yet</h3>
              <p className="card-content">
                Create notes to capture ideas and important information.
              </p>
            </div>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <BackButton onClick={handleReturnToWorkspace} />
      <ModuleContainer title="Scratchpad" type="scratchpad">
        <div className="h-full flex flex-col">
          {/* Add New Note Button - Always visible at the top */}
          {!newNote && (
            <button
              onClick={() => setNewNote({
                content: '',
                color: '#fef3c7',
                font_size: 14,
                is_pinned: false,
                tags: ['Project Notes'],
              })}
              className="btn-add transition-colors mb-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span>Add New Note</span>
            </button>
          )}

          {/* New Note Form - Immediately displayed when New Note is clicked */}
          {newNote && (
            <div className="card p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="card-title flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Note
                </h4>
              </div>

              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={newNote.title || ''}
                    onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                    className="form-input mb-3 w-full"
                    placeholder="Note title"
                    autoFocus
                  />
                  <textarea
                    value={newNote.content || ''}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    className="form-textarea w-full"
                    rows={6}
                    placeholder="Start writing your note here..."
                  />
                </div>

                <div className="flex space-x-3 items-start">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">Tag</label>
                    <select
                      value={newNote.tags?.[0] || TAG_OPTIONS[0]}
                      onChange={(e) => setNewNote(prev => ({ ...prev, tags: [e.target.value] }))}
                      className="form-select"
                    >
                      {TAG_OPTIONS.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">Options</label>
                    <label className="flex items-center space-x-2 text-xs cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={newNote.is_pinned || false}
                          onChange={(e) => setNewNote(prev => ({ ...prev, is_pinned: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="h-4 w-4 rounded border border-foreground-dim/30 bg-transparent peer-checked:border-foreground peer-focus:ring-1 peer-focus:ring-foreground/30 transition-colors flex items-center justify-center">
                          {newNote.is_pinned && (
                            <svg className="h-2.5 w-2.5 text-foreground" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-foreground/80 group-hover:text-foreground transition-colors">Pin this note</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={() => handleCreateNote(newNote)}
                    disabled={saving || !newNote.content?.trim()}
                    className="btn-primary"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Note
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setNewNote(null)}
                    disabled={saving}
                    className="btn-outline"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
            {/* Search and Filter Controls */}
            <div className="relative w-full lg:w-64 flex-shrink-0">
              <Search className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notes..."
                className="search-input w-full"
              />
            </div>
            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`whitespace-nowrap ${!selectedTag
                    ? 'filter-button-active'
                    : 'filter-button'
                    }`}
                >
                  All Notes
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`whitespace-nowrap ${selectedTag === tag
                      ? 'filter-button-active'
                      : 'filter-button'
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Notes List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">


              {/* Individual Note Cards with Direct Edit/Delete Icons */}
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="card"
                >
                  {editingNoteId === note.id ? (
                    // Edit Form
                    <div>
                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            value={note.title}
                            onChange={(e) => {
                              const updatedNotes = notes.map(n =>
                                n.id === note.id ? { ...n, title: e.target.value } : n
                              );
                              setNotes(updatedNotes);
                            }}
                            className="form-input mb-3 w-full"
                            placeholder="Note title"
                            autoFocus
                          />
                          <textarea
                            value={note.content}
                            onChange={(e) => {
                              const updatedNotes = notes.map(n =>
                                n.id === note.id ? { ...n, content: e.target.value } : n
                              );
                              setNotes(updatedNotes);
                            }}
                            className="form-textarea w-full"
                            rows={6}
                            placeholder="Note content..."
                          />
                        </div>

                        <div className="flex space-x-3 items-start">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-2">Tag</label>
                            <select
                              value={note.tags?.[0] || TAG_OPTIONS[0]}
                              onChange={(e) => {
                                const updatedNotes = notes.map(n =>
                                  n.id === note.id ? { ...n, tags: [e.target.value] } : n
                                );
                                setNotes(updatedNotes);
                              }}
                              className="form-select"
                            >
                              {TAG_OPTIONS.map((tag) => (
                                <option key={tag} value={tag}>
                                  {tag}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-foreground mb-2">Options</label>
                            <label className="flex items-center space-x-2 text-xs">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={note.is_pinned}
                                  onChange={(e) => {
                                    const updatedNotes = notes.map(n =>
                                      n.id === note.id ? { ...n, is_pinned: e.target.checked } : n
                                    );
                                    setNotes(updatedNotes);
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="h-4 w-4 rounded border border-foreground-dim/30 bg-transparent peer-checked:border-foreground peer-focus:ring-1 peer-focus:ring-foreground/30 transition-colors flex items-center justify-center">
                                  {note.is_pinned && (
                                    <svg className="h-2.5 w-2.5 text-foreground" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <span className="text-foreground">Pin this note</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 pt-2">
                          <button
                            onClick={() => handleUpdateNote(note.id, note)}
                            disabled={saving}
                            className="btn-primary"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setEditingNoteId(null)}
                            disabled={saving}
                            className="btn-outline"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Display Mode with Direct Edit/Delete Icons
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              {note.title && (
                                <h3 className="font-semibold text-foreground truncate pr-2">{note.title}</h3>
                              )}
                              {note.is_pinned && (
                                <span className="inline-flex items-center text-xs text-foreground/60">
                                  <Pin className="w-3 h-3 mr-1" /> Pinned
                                </span>
                              )}
                            </div>
                            {note.title && <div className="h-px bg-foreground/20 w-full"></div>}
                          </div>
                          <div
                            ref={el => contentRefs.current[note.id] = el}
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedNotes[note.id] ? '' : 'max-h-32'}`}
                          >
                            <div
                              className="prose prose-sm max-w-none mt-4 break-words overflow-hidden"
                              style={{
                                fontSize: `${Math.max(12, note.font_size - 2)}px`,
                                color: 'inherit' // Ensure text color is inherited
                              }}
                            >
                              <MarkdownRenderer
                                content={processContent(note.content, { convertUrls: true })}
                                enableAutoLinks={true}
                              />
                              {/* <ReactMarkdown
                                children={preprocessMarkdown(note.content)}
                                components={{
                                  h1: (props) => <h1 className="text-lg font-semibold mt-2 mb-1 text-foreground/90" {...props} />,
                                  h2: (props) => <h2 className="text-base font-semibold mt-2 mb-1 text-foreground/90" {...props} />,
                                  h3: (props) => <h3 className="text-sm font-semibold mt-1.5 mb-1 text-foreground/90" {...props} />,
                                  h4: (props) => <h4 className="text-sm font-semibold mt-1.5 mb-1 text-foreground/90" {...props} />,
                                  ul: (props) => <ul className="list-disc pl-5 space-y-1 my-1" {...props} />,
                                  ol: (props) => <ol className="list-decimal pl-5 space-y-1 my-1" {...props} />,
                                  li: (props) => <li className="pl-1 text-foreground/60" {...props} />,
                                  p: (props) => <p className="text-xs my-1.5 text-foreground-muted" {...props} />,
                                  strong: (props) => <strong className="font-semibold text-foreground/80" {...props} />,
                                  em: (props) => <em className="italic" {...props} />,
                                  code: ({ node, className, children, ...props }) => {
                                    const isInline = !className?.includes('language-');
                                    if (isInline) {
                                      return (
                                        <code className="bg-foreground/10 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                          {children}
                                        </code>
                                      );
                                    }
                                    return (
                                      <pre className="bg-foreground/10 p-2 rounded-md overflow-x-auto my-2 max-w-full">
                                        <code className="text-xs font-mono" {...props}>
                                          {children}
                                        </code>
                                      </pre>
                                    );
                                  },
                                  a: (props) => (
                                    <a 
                                      className="text-primary hover:underline break-all" 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      {...props} 
                                    />
                                  ),
                                }}
                              >
                              </ReactMarkdown> */}
                            </div>
                          </div>
                          {(note.content.length > 100 || expandedNotes[note.id]) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNoteExpansion(note.id);
                              }}
                              className="text-xs text-primary/80 hover:text-primary hover:underline mt-2 mb-2 flex items-center"
                            >
                              {expandedNotes[note.id] ? (
                                <>
                                  <ChevronUp className="w-3 h-3 mr-1" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3 mr-1" />
                                  Show more
                                </>
                              )}
                            </button>
                          )}
                          <div className="text-xs text-foreground-dim">
                            {format(new Date(note.created_at), 'MMM d, h:mm a')}
                          </div>
                        </div>

                        {/* Direct Edit/Delete/Generate Tasks Icons - Always visible */}
                        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                          <button
                            onClick={() => generateTasksFromNote(note.id)}
                            disabled={isGeneratingTasks || !note.content.trim()}
                            className="p-1.5 text-foreground-dim hover:text-primary hover:bg-foreground-dim/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Generate tasks from this note"
                          >
                            {isGeneratingTasks && selectedNoteForTasks === note.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingNoteId(note.id)}
                            className="p-1.5 text-foreground-dim hover:text-primary hover:bg-foreground-dim/10 rounded-lg transition-colors"
                            title="Edit note"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={saving}
                            className="p-1.5 text-foreground-dim hover:text-red-600 hover:bg-foreground-dim/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete note"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show generated tasks immediately below the note that generated them */}
                  {selectedNoteForTasks === note.id && generatedTasks.length > 0 && (
                    <div className="mt-4">
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <h4 className="text-base font-medium text-primary">Generated Tasks from this Note</h4>
                            <button
                              onClick={toggleAllTasks}
                              className={`text-xs px-2 py-1 rounded ${selectedTaskIds.size === generatedTasks.length
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-primary text-white border border-primary'
                                }`}
                            >
                              {selectedTaskIds.size === generatedTasks.length ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setGeneratedTasks([]);
                                setSelectedTaskIds(new Set());
                                setSelectedNoteForTasks(null);
                              }}
                              className="btn-secondary text-xs px-3 py-1 flex items-center gap-1"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={addTasksToProject}
                              disabled={isGeneratingTasks || selectedTaskIds.size === 0}
                              className="btn-primary text-xs px-3 py-1 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Add {selectedTaskIds.size} Task{selectedTaskIds.size !== 1 ? 's' : ''}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {generatedTasks.map((task, index) => (
                            <div key={index} className="bg-background border border-border rounded-lg p-3">
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
                                  <div className="flex items-start justify-between mb-1">
                                    <div className="flex-1 mr-3">
                                      <h5 className="text-sm font-medium text-foreground">
                                        {task.title}
                                      </h5>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`badge text-xs ${getPriorityBadgeClass(task.priority)}`}>
                                        {task.priority}
                                      </span>
                                    </div>
                                  </div>

                                  <p className="text-foreground-dim text-sm mb-2">
                                    {task.description}
                                  </p>

                                  <div className="flex items-center gap-1 flex-wrap">
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
                            </div>
                          ))}
                        </div>

                        {/* Task Error/Success Messages within the card */}
                        {taskError && (
                          <div className="mt-3 bg-destructive/10 border border-destructive/20 rounded p-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-destructive" />
                            <span className="text-destructive text-xs">{taskError}</span>
                          </div>
                        )}

                        {taskSuccess && (
                          <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded p-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 text-xs">{taskSuccess}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Empty state when filtered */}
              {filteredNotes.length === 0 && notes.length > 0 && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-foreground-dim/50 mx-auto mb-4" />
                  <h3 className="card-title mb-2">No notes found</h3>
                  <p className="card-content">
                    {searchTerm ? `No notes match "${searchTerm}"` : `No notes with tag "${selectedTag}"`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Loading indicator when generating tasks */}
          {isGeneratingTasks && selectedNoteForTasks && (
            <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-primary font-medium">Generating tasks from your note...</span>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-foreground-dim/20">
            <div className="text-sm text-foreground-dim">
              {filteredNotes.length} of {notes.length} notes
              {selectedTag && (
                <span className="ml-2">
                  • Filtered by: <span className="font-medium text-foreground">{selectedTag}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};