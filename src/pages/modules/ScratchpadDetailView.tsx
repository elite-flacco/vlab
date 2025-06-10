import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Search, Pin, Tag, ArrowLeft, Edit3, Save, X, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/supabase';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';

interface ScratchpadNote {
  id: string;
  project_id: string;
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

// Define tag options as specified
const TAG_OPTIONS = [
  'Project Notes',
  'Ideas',
  'Links & Resources',
  'AI Discussion'
];

export const ScratchpadDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<ScratchpadNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isEditingList, setIsEditingList] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<Partial<ScratchpadNote> | null>(null);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (projectId) {
      fetchNotes(projectId);
    }
  }, [projectId]);

  const fetchNotes = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await db.getScratchpadNotes(id);
      if (fetchError) throw fetchError;
      setNotes(data || []);
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
      const { data, error: updateError } = await db.updateScratchpadNote(noteId, updates);
      if (updateError) throw updateError;

      // Update local state
      const updatedNotes = notes.map(note => 
        note.id === noteId ? data : note
      );
      setNotes(updatedNotes);
      setEditingNoteId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update note');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNote = async (noteData: Partial<ScratchpadNote>) => {
    if (!projectId) return;

    setSaving(true);
    setError(null);

    try {
      const newNoteData = {
        project_id: projectId,
        content: noteData.content || 'New note',
        position: noteData.position || { x: 0, y: 0 },
        size: noteData.size || { width: 300, height: 200 },
        color: noteData.color || '#fef3c7',
        font_size: noteData.font_size || 14,
        is_pinned: noteData.is_pinned || false,
        tags: noteData.tags || [],
      };

      const { data, error: createError } = await db.createScratchpadNote(newNoteData);
      if (createError) throw createError;

      // Add to local state
      setNotes(prev => [data, ...prev]);
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
      const { error: deleteError } = await db.deleteScratchpadNote(noteId);
      if (deleteError) throw deleteError;

      // Remove from local state
      setNotes(prev => prev.filter(note => note.id !== noteId));
      setEditingNoteId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete note');
    } finally {
      setSaving(false);
    }
  };

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags || [])));
  
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || (note.tags && note.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const colorOptions = [
    { value: '#fef3c7', label: 'Yellow', class: 'bg-yellow-200' },
    { value: '#fecaca', label: 'Red', class: 'bg-red-200' },
    { value: '#bbf7d0', label: 'Green', class: 'bg-green-200' },
    { value: '#bfdbfe', label: 'Blue', class: 'bg-blue-200' },
    { value: '#e9d5ff', label: 'Purple', class: 'bg-purple-200' },
    { value: '#fed7aa', label: 'Orange', class: 'bg-orange-200' },
    { value: '#f3f4f6', label: 'Gray', class: 'bg-gray-200' },
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
        <ModuleContainer title="Scratchpad" type="scratchpad">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
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
        <div className="mb-6">
          <button
            onClick={handleReturnToWorkspace}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Workspace
          </button>
        </div>
        <ModuleContainer title="Scratchpad" type="scratchpad">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  // No Notes Yet state - only show when there are no notes AND no new note form is active
  if (notes.length === 0 && !newNote) {
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
        <ModuleContainer title="Scratchpad" type="scratchpad">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notes Yet</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Create notes to capture ideas and important information.
              </p>
              <button 
                onClick={() => setNewNote({
                  content: '',
                  color: '#fef3c7',
                  font_size: 14,
                  is_pinned: false,
                  tags: ['Project Notes'], // Default to first tag option
                })}
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </button>
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
      
      <ModuleContainer title="Scratchpad" type="scratchpad">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditingList(!isEditingList)}
                className={`inline-flex items-center px-3 py-1 text-xs rounded-md transition-colors ${
                  isEditingList 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Edit3 className="w-3 h-3 mr-1" />
                {isEditingList ? 'Done Editing' : 'Edit Notes'}
              </button>
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="flex items-center space-x-2 mb-4 overflow-x-auto">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  !selectedTag 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                    selectedTag === tag 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Notes Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-3">
              {/* New Note Form - Rendered at the top when newNote state is active */}
              {newNote && (
                <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Add New Note</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
                      <textarea
                        value={newNote.content || ''}
                        onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                        rows={4}
                        placeholder="Write your note here..."
                        autoFocus
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                        <div className="flex flex-wrap gap-1">
                          {colorOptions.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => setNewNote(prev => ({ ...prev, color: color.value }))}
                              className={`w-6 h-6 rounded-full border-2 ${color.class} ${
                                newNote.color === color.value ? 'border-gray-800' : 'border-gray-300'
                              } hover:border-gray-600 transition-colors`}
                              title={color.label}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                        <select
                          value={newNote.font_size || 14}
                          onChange={(e) => setNewNote(prev => ({ ...prev, font_size: Number(e.target.value) }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                        >
                          <option value={12}>Small (12px)</option>
                          <option value={14}>Medium (14px)</option>
                          <option value={16}>Large (16px)</option>
                          <option value={18}>Extra Large (18px)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tag</label>
                      <select
                        value={newNote.tags?.[0] || TAG_OPTIONS[0]}
                        onChange={(e) => setNewNote(prev => ({ ...prev, tags: [e.target.value] }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        {TAG_OPTIONS.map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newNote.is_pinned || false}
                          onChange={(e) => setNewNote(prev => ({ ...prev, is_pinned: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Pin this note</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCreateNote(newNote)}
                        disabled={saving || !newNote.content?.trim()}
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
                            Create Note
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setNewNote(null)}
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

              {/* Existing Notes */}
              {filteredNotes.map((note) => (
                <div 
                  key={note.id}
                  className="relative bg-white border-l-4 border-yellow-400 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: note.color || '#fef3c7' }}
                >
                  {editingNoteId === note.id ? (
                    // Edit Form
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
                        <textarea
                          value={note.content}
                          onChange={(e) => {
                            const updatedNotes = notes.map(n => 
                              n.id === note.id ? { ...n, content: e.target.value } : n
                            );
                            setNotes(updatedNotes);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm resize-none"
                          rows={4}
                          placeholder="Note content..."
                          autoFocus
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                          <div className="flex flex-wrap gap-1">
                            {colorOptions.map((color) => (
                              <button
                                key={color.value}
                                onClick={() => {
                                  const updatedNotes = notes.map(n => 
                                    n.id === note.id ? { ...n, color: color.value } : n
                                  );
                                  setNotes(updatedNotes);
                                }}
                                className={`w-6 h-6 rounded-full border-2 ${color.class} ${
                                  note.color === color.value ? 'border-gray-800' : 'border-gray-300'
                                } hover:border-gray-600 transition-colors`}
                                title={color.label}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                          <select
                            value={note.font_size}
                            onChange={(e) => {
                              const updatedNotes = notes.map(n => 
                                n.id === note.id ? { ...n, font_size: Number(e.target.value) } : n
                              );
                              setNotes(updatedNotes);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-xs"
                          >
                            <option value={12}>Small (12px)</option>
                            <option value={14}>Medium (14px)</option>
                            <option value={16}>Large (16px)</option>
                            <option value={18}>Extra Large (18px)</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tag</label>
                        <select
                          value={note.tags?.[0] || TAG_OPTIONS[0]}
                          onChange={(e) => {
                            const updatedNotes = notes.map(n => 
                              n.id === note.id ? { ...n, tags: [e.target.value] } : n
                            );
                            setNotes(updatedNotes);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                        >
                          {TAG_OPTIONS.map((tag) => (
                            <option key={tag} value={tag}>
                              {tag}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={note.is_pinned}
                            onChange={(e) => {
                              const updatedNotes = notes.map(n => 
                                n.id === note.id ? { ...n, is_pinned: e.target.checked } : n
                              );
                              setNotes(updatedNotes);
                            }}
                            className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                          />
                          <span className="text-gray-700">Pin this note</span>
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdateNote(note.id, note)}
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
                          onClick={() => setEditingNoteId(null)}
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
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {note.is_pinned && (
                            <Pin className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        {isEditingList && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setEditingNoteId(note.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Edit note"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              disabled={saving}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Delete note"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="pr-6">
                        <p 
                          className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                          style={{ fontSize: `${note.font_size}px` }}
                        >
                          {note.content.length > 200 
                            ? `${note.content.substring(0, 200)}...` 
                            : note.content
                          }
                        </p>
                        
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center space-x-1 mt-2">
                            <Tag className="w-3 h-3 text-gray-400" />
                            <div className="flex flex-wrap gap-1">
                              {note.tags.map((tag, index) => (
                                <span 
                                  key={index}
                                  className="text-xs bg-yellow-200 text-yellow-800 px-1 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 mt-2">
                          {format(new Date(note.created_at), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Note Button - Only show when isEditingList is true and no new note form is active */}
              {isEditingList && !newNote && (
                <button
                  onClick={() => setNewNote({
                    content: '',
                    color: '#fef3c7',
                    font_size: 14,
                    is_pinned: false,
                    tags: [TAG_OPTIONS[0]], // Default to first tag option
                  })}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add New Note</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {filteredNotes.length} of {notes.length} notes
            </div>
            {!isEditingList && (
              <button 
                onClick={() => setIsEditingList(true)}
                className="text-xs px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                New Note
              </button>
            )}
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};