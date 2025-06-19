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
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban');
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
      const { data, error: updateError } = await db.updateRoadmapItem(itemId, updates);
      if (updateError) throw updateError;

      // Update local state
      const updatedItems = roadmapItems.map(item =>
        item.id === itemId ? data : item
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
      const newItemData = {
        project_id: projectId,
        title: itemData.title || 'New Phase',
        description: itemData.description || '',
        status: itemData.status || 'planned',
        phase: itemData.phase || 'backlog',
        start_date: itemData.start_date || null,
        end_date: itemData.end_date || null,
        progress: itemData.progress || 0,
        dependencies: itemData.dependencies || [],
        milestone: itemData.milestone || false,
        color: itemData.color || '#3b82f6',
        position: roadmapItems.length,
      };

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

  const handleDirectProgressChange = async (itemId: string, newProgress: number) => {
    const progress = Math.max(0, Math.min(100, newProgress));

    // Update local state immediately
    const updatedItems = roadmapItems.map(item =>
      item.id === itemId ? { ...item, progress } : item
    );
    setRoadmapItems(updatedItems);

    // Save to database
    await handleUpdateRoadmapItem(itemId, { progress });
  };

  const handleDirectMilestoneToggle = async (itemId: string, milestone: boolean) => {
    // Update local state immediately
    const updatedItems = roadmapItems.map(item =>
      item.id === itemId ? { ...item, milestone } : item
    );
    setRoadmapItems(updatedItems);

    // Save to database
    await handleUpdateRoadmapItem(itemId, { milestone });
  };

  const handleDirectColorChange = async (itemId: string, newColor: string) => {
    // Update local state immediately
    const updatedItems = roadmapItems.map(item =>
      item.id === itemId ? { ...item, color: newColor } : item
    );
    setRoadmapItems(updatedItems);

    // Save to database
    await handleUpdateRoadmapItem(itemId, { color: newColor });
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

  const sortedItems = roadmapItems.sort((a, b) => a.position - b.position);

  // Group items by phase for Kanban view
  const mvpItems = roadmapItems.filter(item => item.phase === 'mvp').sort((a, b) => a.position - b.position);
  const phase2Items = roadmapItems.filter(item => item.phase === 'phase_2').sort((a, b) => a.position - b.position);
  const backlogItems = roadmapItems.filter(item => item.phase === 'backlog').sort((a, b) => a.position - b.position);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'mvp': return 'bg-red-100 text-red-800 border-red-200';
      case 'phase_2': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'backlog': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const colorOptions = [
    { value: '#3b82f6', label: 'Blue', class: 'bg-blue-500' },
    { value: '#10b981', label: 'Green', class: 'bg-green-500' },
    { value: '#f59e0b', label: 'Amber', class: 'bg-amber-500' },
    { value: '#ef4444', label: 'Red', class: 'bg-red-500' },
    { value: '#8b5cf6', label: 'Purple', class: 'bg-purple-500' },
    { value: '#06b6d4', label: 'Cyan', class: 'bg-cyan-500' },
    { value: '#84cc16', label: 'Lime', class: 'bg-lime-500' },
    { value: '#f97316', label: 'Orange', class: 'bg-orange-500' },
  ];

  const renderRoadmapItem = (item: RoadmapItem, index: number, showPhaseSelector = false, isDraggable = false) => {
    const itemContent = (
      <div
        className={`bg-white border-2 rounded-lg p-3 transition-all ${isDragging ? 'shadow-lg' : 'hover:shadow-sm'
          } mb-3 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        {editingItemId === item.id ? (
          // Edit Form
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => {
                  const updatedItems = roadmapItems.map(i =>
                    i.id === item.id ? { ...i, title: e.target.value } : i
                  );
                  setRoadmapItems(updatedItems);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-semibold"
                placeholder="Phase title"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={item.description}
                onChange={(e) => {
                  const updatedItems = roadmapItems.map(i =>
                    i.id === item.id ? { ...i, description: e.target.value } : i
                  );
                  setRoadmapItems(updatedItems);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-none"
                rows={3}
                placeholder="Phase description..."
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={item.status}
                  onChange={(e) => {
                    const updatedItems = roadmapItems.map(i =>
                      i.id === item.id ? { ...i, status: e.target.value as any } : i
                    );
                    setRoadmapItems(updatedItems);
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phase</label>
                <select
                  value={item.phase}
                  onChange={(e) => {
                    const updatedItems = roadmapItems.map(i =>
                      i.id === item.id ? { ...i, phase: e.target.value as any } : i
                    );
                    setRoadmapItems(updatedItems);
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs"
                >
                  <option value="mvp">MVP</option>
                  <option value="phase_2">Phase 2</option>
                  <option value="backlog">Backlog</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={item.end_date || ''}
                  onChange={(e) => {
                    const updatedItems = roadmapItems.map(i =>
                      i.id === item.id ? { ...i, end_date: e.target.value || null } : i
                    );
                    setRoadmapItems(updatedItems);
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.milestone}
                  onChange={(e) => {
                    const updatedItems = roadmapItems.map(i =>
                      i.id === item.id ? { ...i, milestone: e.target.checked } : i
                    );
                    setRoadmapItems(updatedItems);
                  }}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-gray-700">Mark as milestone</span>
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleUpdateRoadmapItem(item.id, item)}
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
                onClick={() => setEditingItemId(null)}
                disabled={saving}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // Display Mode with Direct Editing
          <div>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                {/* Direct Milestone Toggle */}
                <input
                  type="checkbox"
                  checked={item.milestone}
                  onChange={(e) => handleDirectMilestoneToggle(item.id, e.target.checked)}
                  disabled={saving}
                  className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 disabled:opacity-50"
                  title="Toggle milestone"
                />
                {item.milestone && (
                  <Target className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <div className="flex items-center space-x-2">
                {/* Direct Status Dropdown */}
                <select
                  value={item.status}
                  onChange={(e) => handleDirectStatusChange(item.id, e.target.value)}
                  disabled={saving}
                  className={`appearance-none cursor-pointer px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)} disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1`}
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {/* Direct Phase Dropdown (only show in timeline view) */}
                {showPhaseSelector && (
                  <select
                    value={item.phase}
                    onChange={(e) => handleDirectPhaseChange(item.id, e.target.value)}
                    disabled={saving}
                    className={`appearance-none cursor-pointer px-2 py-1 rounded-full text-xs font-medium border ${getPhaseColor(item.phase)} disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1`}
                  >
                    <option value="mvp">MVP</option>
                    <option value="phase_2">Phase 2</option>
                    <option value="backlog">Backlog</option>
                  </select>
                )}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setEditingItemId(item.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit item"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteRoadmapItem(item.id)}
                    disabled={saving}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Delete item"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-xs mb-3 leading-relaxed">{item.description}</p>

            {/* Dates */}
            {(item.start_date || item.end_date) && (
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                {item.start_date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Start: {format(new Date(item.start_date), 'MMM d')}</span>
                  </div>
                )}
                {item.end_date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>End: {format(new Date(item.end_date), 'MMM d')}</span>
                  </div>
                )}
              </div>
            )}
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

  const renderKanbanColumn = (title: string, items: RoadmapItem[], phase: RoadmapItem['phase'], icon: React.ReactNode, bgColor: string) => (
    <div className={`${bgColor} border border-gray-200 rounded-lg p-4 flex flex-col h-full`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center">
          {icon}
          {title} ({items.length})
        </h3>
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
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No {title.toLowerCase()} items yet</p>
                <p className="text-xs mt-1">Drag items here or create new ones</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Roadmap" type="roadmap">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading roadmap...</p>
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Roadmap Yet</h3>
              <p className="text-gray-600 mb-4 text-sm">
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
                className="btn-primary"
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
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${viewMode === 'kanban'
                  ? 'bg-green-100 text-green-800'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${viewMode === 'timeline'
                  ? 'bg-green-100 text-green-800'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Timeline
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
              className="btn-primary"
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
                    'bg-red-50'
                  )}
                  {renderKanbanColumn(
                    'Phase 2',
                    phase2Items,
                    'phase_2',
                    <Map className="w-4 h-4 mr-2" />,
                    'bg-blue-50'
                  )}
                  {renderKanbanColumn(
                    'Backlog',
                    backlogItems,
                    'backlog',
                    <Plus className="w-4 h-4 mr-2" />,
                    'bg-gray-50'
                  )}
                </div>
              </DragDropContext>
            ) : (
              <div className="space-y-3 overflow-y-auto h-full mb-6">
                {/* New Roadmap Item Form - Now at the top */}
                {newRoadmapItem && (
                  <div className="new-form">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="flex items-center">
                        <Plus className="w-5 h-5 mr-2" />
                        Add New Roadmap Item
                      </h4>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={newRoadmapItem.title || ''}
                          onChange={(e) => setNewRoadmapItem(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold"
                          placeholder="Phase title"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={newRoadmapItem.description || ''}
                          onChange={(e) => setNewRoadmapItem(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                          rows={3}
                          placeholder="Phase description..."
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Phase</label>
                          <select
                            value={newRoadmapItem.phase || 'mvp'}
                            onChange={(e) => setNewRoadmapItem(prev => ({ ...prev, phase: e.target.value as any }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                          >
                            <option value="mvp">MVP</option>
                            <option value="phase_2">Phase 2</option>
                            <option value="backlog">Backlog</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                          <input
                            type="date"
                            value={newRoadmapItem.end_date || ''}
                            onChange={(e) => setNewRoadmapItem(prev => ({ ...prev, end_date: e.target.value || null }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={newRoadmapItem.milestone || false}
                            onChange={(e) => setNewRoadmapItem(prev => ({ ...prev, milestone: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">Mark as milestone</span>
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCreateRoadmapItem(newRoadmapItem)}
                          disabled={saving || !newRoadmapItem.title?.trim()}
                          className="inline-flex items-center btn-primary"
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
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline View - Show all items with phase selector */}
                {sortedItems.map((item, index) => renderRoadmapItem(item, index, true, false))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {roadmapItems.length} phase{roadmapItems.length !== 1 ? 's' : ''} • {roadmapItems.filter(item => item.status === 'completed').length} completed
              {viewMode === 'kanban' && (
                <span className="ml-2 text-blue-600">💡 Drag items between columns to change phases</span>
              )}
            </div>
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};