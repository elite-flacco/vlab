import { format } from 'date-fns';
import { ArrowLeft, Calendar, Edit3, Loader2, Map, Plus, Save, Target, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { useNavigate, useParams } from 'react-router-dom';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';
import { BackButton } from '../../components/common/BackButton';
import { db } from '../../lib/supabase';

interface RoadmapItem {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  phase: 'mvp' | 'phase_2' | 'backlog';
  start_date: string | null;
  end_date: string | null;
  progress: number;
  dependencies: string[];
  milestone: boolean;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export const RoadmapDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('timeline');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newRoadmapItem, setNewRoadmapItem] = useState<Partial<RoadmapItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchRoadmapItems(projectId);
    }
  }, [projectId]);

  const fetchRoadmapItems = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await db.getRoadmapItems(id);
      if (fetchError) throw fetchError;
      setRoadmapItems(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roadmap items');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const handleUpdateRoadmapItem = async (itemId: string, updates: Partial<RoadmapItem>) => {
    setSaving(true);
    setError(null);

    try {
      // Format dates to ISO string before saving
      const formattedUpdates = { ...updates };
      if ('start_date' in updates) {
        formattedUpdates.start_date = updates.start_date || null;
      }
      if ('end_date' in updates) {
        formattedUpdates.end_date = updates.end_date || null;
      }

      const { data, error: updateError } = await db.updateRoadmapItem(itemId, formattedUpdates);
      if (updateError) throw updateError;

      // Update local state with the server response if available, or with the updates
      const updatedItems = roadmapItems.map(item =>
        item.id === itemId ? (data || { ...item, ...formattedUpdates }) : item
      );
      setRoadmapItems(updatedItems);
      setEditingItemId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update roadmap item');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRoadmapItem = async (itemData: Partial<RoadmapItem>) => {
    if (!projectId) return;

    setSaving(true);
    setError(null);

    try {
      // Format dates to ISO string before saving
      const formattedEndDate = itemData.end_date ?
        (typeof itemData.end_date === 'string' ?
          itemData.end_date :
          new Date(itemData.end_date).toISOString()) :
        null;

      const newItemData = {
        project_id: projectId,
        title: itemData.title || 'New Phase',
        description: itemData.description || '',
        status: itemData.status || 'planned',
        phase: itemData.phase || 'mvp',
        start_date: null, // Start date is not used in the form
        end_date: formattedEndDate,
        progress: 0,
        dependencies: [],
        milestone: false,
        color: '#3b82f6',
        position: roadmapItems.length,
      };

      // Validate dates if both are present
      if (newItemData.start_date && newItemData.end_date) {
        const start = new Date(newItemData.start_date);
        const end = new Date(newItemData.end_date);
        if (start > end) {
          throw new Error('End date cannot be before start date');
        }
      }

      const { data, error: createError } = await db.createRoadmapItem(newItemData);
      if (createError) throw createError;

      // Add to local state
      setRoadmapItems(prev => [...prev, data]);
      setNewRoadmapItem(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create roadmap item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoadmapItem = async (itemId: string) => {
    setSaving(true);
    setError(null);

    try {
      const { error: deleteError } = await db.deleteModuleData('roadmap_items', itemId);
      if (deleteError) throw deleteError;

      // Remove from local state and update positions
      const updatedItems = roadmapItems
        .filter(item => item.id !== itemId)
        .map((item, index) => ({ ...item, position: index }));

      setRoadmapItems(updatedItems);
      setEditingItemId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete roadmap item');
    } finally {
      setSaving(false);
    }
  };

  // Drag and Drop Handler
  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);

    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area, do nothing
    if (!destination) {
      return;
    }

    // If dropped in the same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourcePhase = source.droppableId as RoadmapItem['phase'];
    const destinationPhase = destination.droppableId as RoadmapItem['phase'];

    // Get the item being moved
    const movedItem = roadmapItems.find(item => item.id === draggableId);
    if (!movedItem) return;

    // Create new roadmap items array with updated positions and phases
    let updatedItems = [...roadmapItems];

    // Remove the item from its current position
    updatedItems = updatedItems.filter(item => item.id !== draggableId);

    // Get items in the destination phase (excluding the moved item)
    const destinationItems = updatedItems.filter(item => item.phase === destinationPhase);

    // Insert the moved item at the new position
    const updatedMovedItem = {
      ...movedItem,
      phase: destinationPhase,
    };

    destinationItems.splice(destination.index, 0, updatedMovedItem);

    // Update positions for items in the destination phase
    const destinationItemsWithPositions = destinationItems.map((item, index) => ({
      ...item,
      position: index,
    }));

    // Combine all items
    const otherPhaseItems = updatedItems.filter(item => item.phase !== destinationPhase);
    const finalItems = [...otherPhaseItems, ...destinationItemsWithPositions];

    // Update local state immediately for better UX
    setRoadmapItems(finalItems);

    // Update the database for all affected items
    try {
      setSaving(true);

      // Update the moved item's phase
      if (sourcePhase !== destinationPhase) {
        await handleUpdateRoadmapItem(draggableId, {
          phase: destinationPhase,
          position: destination.index
        });
      } else {
        await handleUpdateRoadmapItem(draggableId, {
          position: destination.index
        });
      }

      // Update positions for other items in the destination phase if needed
      const positionUpdates = destinationItemsWithPositions
        .filter(item => item.id !== draggableId)
        .map(item => handleUpdateRoadmapItem(item.id, { position: item.position }));

      await Promise.all(positionUpdates);

    } catch (err: any) {
      // Revert local state on error
      setRoadmapItems(roadmapItems);
      setError(err.message || 'Failed to update item positions');
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Direct editing handlers
  const handleDirectStatusChange = async (itemId: string, newStatus: string) => {
    // Update local state immediately for better UX
    const updatedItems = roadmapItems.map(item =>
      item.id === itemId ? { ...item, status: newStatus as RoadmapItem['status'] } : item
    );
    setRoadmapItems(updatedItems);

    // Save to database
    await handleUpdateRoadmapItem(itemId, { status: newStatus as RoadmapItem['status'] });
  };

  const handleDirectPhaseChange = async (itemId: string, newPhase: string) => {
    // Update local state immediately
    const updatedItems = roadmapItems.map(item =>
      item.id === itemId ? { ...item, phase: newPhase as RoadmapItem['phase'] } : item
    );
    setRoadmapItems(updatedItems);

    // Save to database
    await handleUpdateRoadmapItem(itemId, { phase: newPhase as RoadmapItem['phase'] });
  };

  // Group items by phase for Kanban view
  const mvpItems = roadmapItems.filter(item => item.phase === 'mvp').sort((a, b) => a.position - b.position);
  const phase2Items = roadmapItems.filter(item => item.phase === 'phase_2').sort((a, b) => a.position - b.position);
  const backlogItems = roadmapItems.filter(item => item.phase === 'backlog').sort((a, b) => a.position - b.position);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 border-green-500/20';
      case 'in_progress': return 'text-blue-400 border-blue-500/20';
      case 'cancelled': return 'text-red-400 border-red-500/20';
      default: return 'text-foreground-dim border-foreground-dim/20';
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'mvp': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'phase_2': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'backlog': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  // Helper to show native date picker
  const showDatePicker = (elementId: string) => {
    const input = document.getElementById(elementId) as HTMLInputElement;
    if (input) {
      try {
        if (typeof input.showPicker === 'function') {
          input.showPicker();
        } else {
          // Fallback: focus the input to show the date picker on mobile
          input.focus();
        }
      } catch (err) {
        console.error('Error showing date picker:', err);
        input.focus(); // Fallback to default behavior
      }
    }
  };

  // Format date for display
  const formatDisplayDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const renderRoadmapItem = (item: RoadmapItem, index: number, showPhaseSelector = false, isDraggable = false) => {
    const itemContent = (
      <div
        className={`card p-3 transition-all ${isDragging ? 'shadow-lg' : ''
          } mb-3 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        {editingItemId === item.id ? (
          // Edit Form
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Title</label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => {
                  const updatedItems = roadmapItems.map(i =>
                    i.id === item.id ? { ...i, title: e.target.value } : i
                  );
                  setRoadmapItems(updatedItems);
                }}
                className="form-input"
                placeholder="Phase title"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Description</label>
              <textarea
                value={item.description}
                onChange={(e) => {
                  const updatedItems = roadmapItems.map(i =>
                    i.id === item.id ? { ...i, description: e.target.value } : i
                  );
                  setRoadmapItems(updatedItems);
                }}
                className="form-textarea"
                rows={3}
                placeholder="Phase description..."
              />
            </div>

            <div className="flex space-x-2 items-start">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Status</label>
                <select
                  value={item.status}
                  onChange={(e) => {
                    const updatedItems = roadmapItems.map(i =>
                      i.id === item.id ? { ...i, status: e.target.value as any } : i
                    );
                    setRoadmapItems(updatedItems);
                  }}
                  className="form-select"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Phase</label>
                <select
                  value={item.phase}
                  onChange={(e) => {
                    const updatedItems = roadmapItems.map(i =>
                      i.id === item.id ? { ...i, phase: e.target.value as any } : i
                    );
                    setRoadmapItems(updatedItems);
                  }}
                  className="form-select"
                >
                  <option value="mvp">MVP</option>
                  <option value="phase_2">Phase 2</option>
                  <option value="backlog">Backlog</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">End Date</label>
                <div className="relative w-full">
                  <input
                    type="date"
                    value={item.end_date?.split('T')[0] || ''}
                    onChange={(e) => {
                      const updatedItems = roadmapItems.map((i) =>
                        i.id === item.id ? { ...i, end_date: e.target.value ? `${e.target.value}T00:00:00.000Z` : null } : i
                      );
                      setRoadmapItems(updatedItems);
                    }}
                    className="form-input w-full pr-8 text-sm"
                    id={`end-date-${item.id}`}
                  />
                  <div className="absolute right-0 top-0 h-full flex items-center pr-2 space-x-1">
                    {item.end_date && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updatedItems = roadmapItems.map((i) =>
                            i.id === item.id ? { ...i, end_date: null } : i
                          );
                          setRoadmapItems(updatedItems);
                        }}
                        className="text-foreground-dim hover:text-foreground transition-colors"
                        title="Clear date"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => showDatePicker(`end-date-${item.id}`)}
                      className="text-foreground-dim hover:text-foreground transition-colors"
                      title="Pick a date"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleUpdateRoadmapItem(item.id, item)}
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
                onClick={() => setEditingItemId(null)}
                disabled={saving}
                className="btn-outline"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start">
              <h4 className="font-semibold text-foreground text-sm truncate flex-1 pr-2">{item.title}</h4>
              {viewMode !== 'kanban' && (
                <div className="flex-shrink-0 flex items-center space-x-1">
                  <button
                    onClick={() => setEditingItemId(item.id)}
                    className="p-1.5 text-foreground-dim hover:text-primary hover:bg-foreground-dim/10 rounded-lg transition-colors"
                    title="Edit item"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteRoadmapItem(item.id)}
                    disabled={saving}
                    className="p-1 text-foreground-dim hover:text-red-600 transition-colors disabled:opacity-50 flex-shrink-0"
                    title="Delete item"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-foreground-dim text-xs mb-3 leading-relaxed">{item.description}</p>

            {/* Dates */}
            {(item.start_date || item.end_date) && (
              <div className="flex items-center space-x-3 text-xs text-foreground-dim mb-3">
                {item.start_date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Start: {formatDisplayDate(item.start_date)}</span>
                  </div>
                )}
                {item.end_date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>End: {formatDisplayDate(item.end_date)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Status and Milestone Controls */}
            <div className="flex items-center space-x-3 mt-1 pt-3 border-t border-foreground-dim/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <select
                    value={item.status}
                    onChange={(e) => handleDirectStatusChange(item.id, e.target.value)}
                    disabled={saving}
                    className={`bg-gray-800 cursor-pointer px-2 py-1 rounded-full text-2xs border ${getStatusColor(
                      item.status
                    )} disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-offset-1`}
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              {/* Phase Dropdown (only show in timeline view) */}
              {/* {showPhaseSelector && (
                <div className="px-1">
                  <select
                    value={item.phase}
                    onChange={(e) => handleDirectPhaseChange(item.id, e.target.value)}
                    disabled={saving}
                    className={`w-full appearance-none cursor-pointer px-2 py-1 rounded-full text-xs font-medium border ${getPhaseColor(
                      item.phase
                    )} disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1`}
                  >
                    <option value="mvp">MVP</option>
                    <option value="phase_2">Phase 2</option>
                    <option value="backlog">Backlog</option>
                  </select>
                </div>
              )} */}
            </div>
          </div>
        )}
      </div>
    );

    // Wrap with Draggable if in Kanban mode
    if (isDraggable && viewMode === 'kanban') {
      return (
        <Draggable key={item.id} draggableId={item.id} index={index}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className={snapshot.isDragging ? 'opacity-75' : ''}
            >
              {itemContent}
            </div>
          )}
        </Draggable>
      );
    }

    return <div key={item.id}>{itemContent}</div>;
  };

  const renderKanbanColumn = (title: string, items: RoadmapItem[], phase: RoadmapItem['phase'], icon: React.ReactNode, bgColor: string) => {
    return (
      <div className={`${bgColor} rounded-lg p-4 flex flex-col h-full`}>
        <div className="flex items-start justify-between mb-2 w-full min-w-0">
          <h4 className="font-semibold text-foreground text-sm truncate pr-2">{title}</h4>
          <div className="flex-shrink-0 flex items-center space-x-1">
            {icon}
            <span className="text-xs text-foreground-dim">{items.length}</span>
          </div>
        </div>
        <Droppable droppableId={phase}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 space-y-3 min-h-32 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-2' : ''
                }`}
            >
              {items.map((item, index) => renderRoadmapItem(item, index, false, true))}
              {provided.placeholder}
              {items.length === 0 && !snapshot.isDraggingOver && (
                <div className="text-center py-8 text-foreground-dim">
                  <p className="text-sm">No {title.toLowerCase()} items yet</p>
                  <p className="text-xs mt-1">Drag items here or create new ones</p>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Roadmap" type="roadmap">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="loading-spinner"></div>
              <p className="mt-4 text-foreground-dim">Loading roadmap...</p>
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
        <ModuleContainer title="Roadmap" type="roadmap">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-foreground-dim">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  if (roadmapItems.length === 0 && !newRoadmapItem) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Roadmap" type="roadmap">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Roadmap Yet</h3>
              <p className="text-foreground-dim mb-4 text-sm">
                Create roadmap items to plan your project phases.
              </p>
              <button
                onClick={() => setNewRoadmapItem({
                  title: '',
                  description: '',
                  status: 'planned',
                  phase: 'mvp',
                  progress: 0,
                  milestone: false,
                  color: '#3b82f6',
                  dependencies: [],
                })}
                className="btn-add"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Phase
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
      <ModuleContainer title="Roadmap" type="roadmap">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('timeline')}
                className={`${viewMode === 'timeline'
                  ? 'filter-button-active'
                  : 'filter-button'
                  }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`${viewMode === 'kanban'
                  ? 'filter-button-active'
                  : 'filter-button'
                  }`}
              >
                Kanban
              </button>

            </div>

            <button
              onClick={() => setNewRoadmapItem({
                title: '',
                description: '',
                status: 'planned',
                phase: 'mvp',
                progress: 0,
                milestone: false,
                color: '#3b82f6',
                dependencies: [],
              })}
              className="btn-add py-1"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add New Phase
            </button>
          </div>

          {/* Roadmap Content */}
          <div className="flex-1 overflow-hidden">
            {viewMode === 'kanban' ? (
              <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                  {renderKanbanColumn(
                    'MVP',
                    mvpItems,
                    'mvp',
                    <Target className="w-4 h-4 mr-2" />,
                    'bg-red-500/5'
                  )}
                  {renderKanbanColumn(
                    'Phase 2',
                    phase2Items,
                    'phase_2',
                    <Map className="w-4 h-4 mr-2" />,
                    'bg-purple-500/5'
                  )}
                  {renderKanbanColumn(
                    'Backlog',
                    backlogItems,
                    'backlog',
                    <Plus className="w-4 h-4 mr-2" />,
                    'bg-yellow-500/5'
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs text-foreground-dim italic">Drag and drop functionality coming soon</p>
                </div>
              </DragDropContext>
            ) : (
              <div className="space-y-3 overflow-y-auto h-full mb-6">
                {/* New Roadmap Item Form - Now at the top */}
                {newRoadmapItem && (
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="flex items-center">
                        <Plus className="w-5 h-5 mr-2" />
                        Add New Roadmap Item
                      </h4>
                    </div>
                    <div className="space-y-3">
                      <div className="px-1">
                        <label className="block text-xs font-medium text-foreground-dim mb-1">Title</label>
                        <input
                          type="text"
                          value={newRoadmapItem.title || ''}
                          onChange={(e) => setNewRoadmapItem(prev => ({ ...prev, title: e.target.value }))}
                          className="form-input"
                          placeholder="Phase title"
                          autoFocus
                        />
                      </div>

                      <div className="px-1">
                        <label className="block text-xs font-medium text-foreground-dim mb-1">Description</label>
                        <textarea
                          value={newRoadmapItem.description || ''}
                          onChange={(e) => setNewRoadmapItem(prev => ({ ...prev, description: e.target.value }))}
                          className="form-textarea"
                          rows={3}
                          placeholder="Phase description..."
                        />
                      </div>

                      <div className="flex space-x-3 items-start">
                        <div className="px-1">
                          <label className="block text-xs font-medium text-foreground-dim mb-1">Phase</label>
                          <select
                            value={newRoadmapItem.phase || 'mvp'}
                            onChange={(e) => setNewRoadmapItem(prev => ({ ...prev, phase: e.target.value as any }))}
                            className="form-select"
                          >
                            <option value="mvp">MVP</option>
                            <option value="phase_2">Phase 2</option>
                            <option value="backlog">Backlog</option>
                          </select>
                        </div>
                        <div className="px-1">
                          <label className="block text-xs font-medium text-foreground-dim mb-1">End Date</label>
                          <div className="relative w-full">
                            <input
                              type="date"
                              value={newRoadmapItem.end_date?.split('T')[0] || ''}
                              onChange={(e) => setNewRoadmapItem(prev => ({
                                ...prev,
                                end_date: e.target.value ? `${e.target.value}T00:00:00.000Z` : null
                              }))}
                              className="form-input w-full pr-8 text-sm"
                              id="new-item-end-date"
                            />
                            <div className="absolute right-0 top-0 h-full flex items-center pr-2 space-x-1">
                              {newRoadmapItem.end_date && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNewRoadmapItem(prev => ({ ...prev, end_date: null }));
                                  }}
                                  className="text-foreground-dim hover:text-foreground transition-colors"
                                  title="Clear date"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => showDatePicker('new-item-end-date')}
                                className="text-foreground-dim hover:text-foreground transition-colors"
                                title="Pick a date"
                              >
                                <Calendar className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCreateRoadmapItem(newRoadmapItem)}
                          disabled={saving || !newRoadmapItem.title?.trim()}
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
                              Create Phase
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setNewRoadmapItem(null)}
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

                {/* Timeline View - Grouped by phase */}
                <div className="space-y-6">
                  {/* MVP Phase */}
                  {mvpItems.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-md text-xs font-medium ${getPhaseColor('mvp')}`}>
                          MVP
                        </div>
                        {/* <div className="flex-1 border-t border-gray-200"></div> */}
                      </div>
                      {mvpItems.map((item, index) => renderRoadmapItem(item, index, true, false))}
                    </div>
                  )}

                  {/* Phase 2 */}
                  {phase2Items.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-md text-xs font-medium ${getPhaseColor('phase_2')}`}>
                          Phase 2
                        </div>
                        {/* <div className="flex-1 border-t border-gray-200"></div> */}
                      </div>
                      {phase2Items.map((item, index) => renderRoadmapItem(item, index, true, false))}
                    </div>
                  )}

                  {/* Backlog */}
                  {backlogItems.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-md text-xs font-medium ${getPhaseColor('backlog')}`}>
                          Backlog
                        </div>
                        {/* <div className="flex-1 border-t border-gray-200"></div> */}
                      </div>
                      {backlogItems.map((item, index) => renderRoadmapItem(item, index, true, false))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200 text-foreground-dim">
            <div className="text-xs text-gray-500">
              {roadmapItems.length} phase{roadmapItems.length !== 1 ? 's' : ''} • {roadmapItems.filter(item => item.status === 'completed').length} completed
              {/* {viewMode === 'kanban' && (
                <span className="ml-2 text-blue-600">💡 Drag items between columns to change phases</span>
              )} */}
            </div>
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};