import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Loader2,
  Pin,
  Plus,
  Save,
  Search,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleContainer } from "../components/Workspace/ModuleContainer";
import { BackButton } from "../components/common/BackButton";
import {
  MarkdownRenderer,
  useMarkdownPreprocessing,
} from "../components/common/MarkdownRenderer";
import { db } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";

interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

interface GlobalNote {
  id: string;
  user_id: string;
  title: string | null;
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

// interface GeneratedTask {
//   title: string;
//   description: string;
//   status: "todo" | "in_progress" | "done" | "blocked";
//   priority: "low" | "medium" | "high" | "highest";
//   estimated_hours?: number;
//   due_date?: string;
//   tags: string[];
//   dependencies: string[];
//   position: number;
// }

// Define tag options as specified
const TAG_OPTIONS = [
  "General Notes",
  "Ideas",
  "Links & Resources",
  "AI Discussion",
];

// Use consistent tag styling across all modules
export const GlobalScratchpad: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<GlobalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<Partial<GlobalNote> | null>(null);
  const [saving, setSaving] = useState(false);
  const { processContent } = useMarkdownPreprocessing();

  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>(
    {},
  );
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Task generation state (disabled for global notes initially)

  useEffect(() => {
    if (user) {
      fetchNotes(user.id);
    }
  }, [user]);

  const fetchNotes = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = (await db.getGlobalNotes(userId)) as DatabaseResponse<
        GlobalNote[]
      >;
      if (response.error) throw response.error;
      setNotes(response.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToDashboard = () => {
    navigate("/");
  };

  const handleUpdateNote = async (
    noteId: string,
    updates: Partial<GlobalNote>,
  ) => {
    setSaving(true);
    setError(null);

    try {
      const response = (await db.updateGlobalNote(
        noteId,
        updates,
      )) as DatabaseResponse<GlobalNote>;
      if (response.error) throw response.error;

      // Update local state
      const updatedNotes = notes.map((note) =>
        note.id === noteId ? { ...note, ...updates } : note,
      );
      setNotes(updatedNotes);
      setEditingNoteId(null);
    } catch (err: any) {
      setError(err.message || "Failed to update note");
    } finally {
      setSaving(false);
    }
  };

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [noteId]: !prev[noteId],
    }));
  };

  const handleCreateNote = async (noteData: Partial<GlobalNote>) => {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      const newNoteData = {
        user_id: user.id,
        title: noteData.title || null,
        content: noteData.content || "New note",
        position: noteData.position || { x: 0, y: 0 },
        size: noteData.size || { width: 300, height: 200 },
        color: noteData.color || "#fef3c7",
        font_size: noteData.font_size || 14,
        is_pinned: noteData.is_pinned || false,
        tags: noteData.tags || [],
      };

      const response = (await db.createGlobalNote(
        newNoteData,
      )) as DatabaseResponse<GlobalNote>;
      if (response.error) throw response.error;

      // Add to local state
      setNotes((prev) => (response.data ? [response.data, ...prev] : prev));
      setNewNote(null);
    } catch (err: any) {
      setError(err.message || "Failed to create note");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setSaving(true);
    setError(null);

    try {
      const response = (await db.deleteGlobalNote(
        noteId,
      )) as DatabaseResponse<void>;
      if (response.error) throw response.error;

      // Remove from local state
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      setEditingNoteId(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete note");
    } finally {
      setSaving(false);
    }
  };

  // Note: Task generation disabled for global notes since they're not project-specific
  // const generateTasksFromNote = async (noteId: string) => {
  //   setError(
  //     "Task generation is not available for global notes. Create tasks within specific projects.",
  //   );
  // };

  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags || [])));

  const filteredNotes = notes
    .filter((note) => {
      const matchesSearch =
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.title &&
          note.title.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTag =
        !selectedTag || (note.tags && note.tags.includes(selectedTag));
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      // Sort pinned notes first, then by most recently updated
      if (a.is_pinned === b.is_pinned) {
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      }
      return a.is_pinned ? -1 : 1;
    });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToDashboard} />
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
        <BackButton onClick={handleReturnToDashboard} />
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
        <BackButton onClick={handleReturnToDashboard} />
        <ModuleContainer title="Scratchpad" type="scratchpad">
          <div className="h-full flex items-center justify-center">
            <div className="text-center pt-4">
              <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="mb-2">No Notes Yet</h3>
              <p className="mb-4 text-sm">
                Create project-agnostic notes to capture ideas and important
                information.
              </p>
              <button
                onClick={() =>
                  setNewNote({
                    title: "",
                    content: "",
                    color: "#fef3c7",
                    font_size: 14,
                    is_pinned: false,
                    tags: [],
                  })
                }
                className="btn-add mb-6"
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
      <BackButton onClick={handleReturnToDashboard} />
      <ModuleContainer title="Scratchpad" type="scratchpad">
        <div className="h-full flex flex-col">
          {/* Add New Note Button - Always visible at the top */}
          {!newNote && (
            <button
              onClick={() =>
                setNewNote({
                  content: "",
                  color: "#fef3c7",
                  font_size: 14,
                  is_pinned: false,
                  tags: ["General Notes"],
                })
              }
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
                    value={newNote.title || ""}
                    onChange={(e) =>
                      setNewNote((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="form-input mb-3 w-full"
                    placeholder="Note title (optional)"
                    autoFocus
                  />
                  <textarea
                    value={newNote.content || ""}
                    onChange={(e) =>
                      setNewNote((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    className="form-textarea w-full"
                    rows={6}
                    placeholder="Start writing your note here..."
                  />
                </div>

                <div className="flex space-x-3 items-start">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">
                      Tag
                    </label>
                    <select
                      value={newNote.tags?.[0] || TAG_OPTIONS[0]}
                      onChange={(e) =>
                        setNewNote((prev) => ({
                          ...prev,
                          tags: [e.target.value],
                        }))
                      }
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
                    <label className="block text-xs font-medium text-foreground mb-2">
                      Options
                    </label>
                    <label className="flex items-center space-x-2 text-xs cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={newNote.is_pinned || false}
                          onChange={(e) =>
                            setNewNote((prev) => ({
                              ...prev,
                              is_pinned: e.target.checked,
                            }))
                          }
                          className="form-checkbox"
                        />
                      </div>
                      <span className="text-foreground/80 group-hover:text-foreground transition-colors">
                        Pin this note
                      </span>
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
            {notes.length > 0 && (
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
            )}
            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`whitespace-nowrap ${
                    !selectedTag ? "filter-button-active" : "filter-button"
                  }`}
                >
                  All Notes
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`whitespace-nowrap ${
                      selectedTag === tag
                        ? "filter-button-active"
                        : "filter-button"
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
                <div key={note.id} className="card">
                  {editingNoteId === note.id ? (
                    // Edit Form
                    <div>
                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            value={note.title || ""}
                            onChange={(e) => {
                              const updatedNotes = notes.map((n) =>
                                n.id === note.id
                                  ? { ...n, title: e.target.value }
                                  : n,
                              );
                              setNotes(updatedNotes);
                            }}
                            className="form-input mb-3 w-full"
                            placeholder="Note title (optional)"
                            autoFocus
                          />
                          <textarea
                            value={note.content}
                            onChange={(e) => {
                              const updatedNotes = notes.map((n) =>
                                n.id === note.id
                                  ? { ...n, content: e.target.value }
                                  : n,
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
                            <label className="block text-xs font-medium text-foreground mb-2">
                              Tag
                            </label>
                            <select
                              value={note.tags?.[0] || TAG_OPTIONS[0]}
                              onChange={(e) => {
                                const updatedNotes = notes.map((n) =>
                                  n.id === note.id
                                    ? { ...n, tags: [e.target.value] }
                                    : n,
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
                            <label className="block text-xs font-medium text-foreground mb-2">
                              Options
                            </label>
                            <label className="flex items-center space-x-2 text-xs">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={note.is_pinned}
                                  onChange={(e) => {
                                    const updatedNotes = notes.map((n) =>
                                      n.id === note.id
                                        ? { ...n, is_pinned: e.target.checked }
                                        : n,
                                    );
                                    setNotes(updatedNotes);
                                  }}
                                  className="form-checkbox"
                                />
                              </div>
                              <span className="text-foreground">
                                Pin this note
                              </span>
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
                                <h3 className="font-semibold text-foreground truncate pr-2">
                                  {note.title}
                                </h3>
                              )}
                              {note.is_pinned && (
                                <span className="inline-flex items-center text-xs text-foreground/60">
                                  <Pin className="w-3 h-3 mr-1" /> Pinned
                                </span>
                              )}
                            </div>
                            {note.title && (
                              <div className="h-px bg-foreground/20 w-full"></div>
                            )}
                          </div>
                          <div
                            ref={(el) => (contentRefs.current[note.id] = el)}
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedNotes[note.id] ? "" : "max-h-32"}`}
                          >
                            <div
                              className="prose prose-sm max-w-none mt-4 break-words overflow-hidden"
                              style={{
                                fontSize: `${Math.max(12, note.font_size - 2)}px`,
                                color: "inherit", // Ensure text color is inherited
                              }}
                            >
                              <MarkdownRenderer
                                content={processContent(note.content, {
                                  convertUrls: true,
                                })}
                                enableAutoLinks={true}
                              />
                            </div>
                          </div>
                          {(note.content.length > 100 ||
                            expandedNotes[note.id]) && (
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
                            {format(new Date(note.created_at), "MMM d, h:mm a")}
                          </div>
                        </div>

                        {/* Direct Edit/Delete Icons - Always visible */}
                        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
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
                </div>
              ))}

              {/* Empty state when filtered */}
              {filteredNotes.length === 0 && notes.length > 0 && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-foreground-dim/50 mx-auto mb-4" />
                  <h3 className="card-title mb-2">No notes found</h3>
                  <p className="card-content">
                    {searchTerm
                      ? `No notes match "${searchTerm}"`
                      : `No notes with tag "${selectedTag}"`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-foreground-dim/20">
            <div className="text-sm text-foreground-dim">
              {filteredNotes.length} of {notes.length} notes
              {selectedTag && (
                <span className="ml-2">
                  • Filtered by:{" "}
                  <span className="font-medium text-foreground">
                    {selectedTag}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};
