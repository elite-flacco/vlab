import { format } from 'date-fns';
import { Edit3, Loader2, Pin, Plus, Save, Search, StickyNote, Tag, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';
import { BackButton } from '../../components/common/BackButton';
import { db } from '../../lib/supabase';

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
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Scratchpad" type="scratchpad">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"></div>
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
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Scratchpad" type="scratchpad">
          <div className="h-full flex items-center justify-center py-12">
            <div className="text-center">
              <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notes Yet</h3>
              <p className="text-gray-600 mb-4 text-sm">
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
              <Plus className="w-4 h-4" />
              <span>Add New Note</span>
            </button>
          )}

          {/* New Note Form - Immediately displayed when New Note is clicked */}
          {newNote && (
            <div className="new-form">
              <div className="flex items-center justify-between mb-4">
                <h4 className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Note
                </h4>
              </div>

              <div className="space-y-3">
                <div>
                  <textarea
                    value={newNote.content || ''}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1text-sm resize-none"
                    rows={6}
                    placeholder="Start writing your note here..."
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tag</label>
                    <select
                      value={newNote.tags?.[0] || TAG_OPTIONS[0]}
                      onChange={(e) => setNewNote(prev => ({ ...prev, tags: [e.target.value] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 text-sm"
                    >
                      {TAG_OPTIONS.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
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
                    className="inline-flex items-center px-3 py-1 btn-outline"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center space-x-3 mb-6">
            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="flex items-center space-x-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-3 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${!selectedTag
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                    }`}
                >
                  All Notes
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${selectedTag === tag
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            {/* Search and Filter Controls */}
            <div className="relative flex-1">
              <Search className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notes..."
                className="search-input"
              />
            </div>
          </div>
          {/* Notes List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">


              {/* Individual Note Cards with Direct Edit/Delete Icons */}
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="relative bg-white border rounded-md shadow-lg hover:shadow-md transition-all duration-200 group"
                >
                  {editingNoteId === note.id ? (
                    // Edit Form
                    <div className="p-4">
                      <div className="space-y-4">
                        <div>
                          <textarea
                            value={note.content}
                            onChange={(e) => {
                              const updatedNotes = notes.map(n =>
                                n.id === note.id ? { ...n, content: e.target.value } : n
                              );
                              setNotes(updatedNotes);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-1 text-sm resize-none"
                            rows={6}
                            placeholder="Note content..."
                            autoFocus
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tag</label>
                            <select
                              value={note.tags?.[0] || TAG_OPTIONS[0]}
                              onChange={(e) => {
                                const updatedNotes = notes.map(n =>
                                  n.id === note.id ? { ...n, tags: [e.target.value] } : n
                                );
                                setNotes(updatedNotes);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 text-sm"
                            >
                              {TAG_OPTIONS.map((tag) => (
                                <option key={tag} value={tag}>
                                  {tag}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
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
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {note.is_pinned && (
                            <Pin className="w-4 h-4 text-yellow-600" />
                          )}
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Tag className="w-3 h-3 text-gray-500" />
                              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-medium">
                                {note.tags[0]}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Direct Edit/Delete Icons - Always visible */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingNoteId(note.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white hover:bg-opacity-50 rounded-lg transition-all"
                            title="Edit note"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={saving}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-white hover:bg-opacity-50 rounded-lg transition-all disabled:opacity-50"
                            title="Delete note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="pr-2">
                        <p
                          className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-3"
                          style={{ fontSize: `${note.font_size}px` }}
                        >
                          {note.content}
                        </p>

                        <div className="text-xs text-gray-500">
                          {format(new Date(note.created_at), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Empty state when filtered */}
              {filteredNotes.length === 0 && notes.length > 0 && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? `No notes match "${searchTerm}"` : `No notes with tag "${selectedTag}"`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {filteredNotes.length} of {notes.length} notes
              {selectedTag && (
                <span className="ml-2">
                  • Filtered by: <span className="font-medium">{selectedTag}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};