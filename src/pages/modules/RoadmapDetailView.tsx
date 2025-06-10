import React, { useState, useEffect } from 'react';
import { Map, Calendar, Target, Plus, Edit3, ArrowLeft, Save, X, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/supabase';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';

interface RoadmapItem {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
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
  const [isEditingList, setIsEditingList] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newRoadmapItem, setNewRoadmapItem] = useState<Partial<RoadmapItem> | null>(null);
  const [saving, setSaving] = useState(false);
  
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

  const sortedItems = roadmapItems.sort((a, b) => a.position - b.position);

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
        <div className="mb-6">
          <button
            onClick={handleReturnToWorkspace}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Workspace
          </button>
        </div>
        <ModuleContainer title="Roadmap" type="roadmap">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  if (roadmapItems.length === 0 && !isEditingList) {
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
        <ModuleContainer title="Roadmap" type="roadmap">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Roadmap Yet</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Create roadmap items to plan your project phases.
              </p>
              <button 
                onClick={() => setIsEditingList(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
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
      <div className="mb-6">
        <button
          onClick={handleReturnToWorkspace}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Workspace
        </button>
      </div>
      
      <ModuleContainer title="Roadmap" type="roadmap">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  viewMode === 'kanban' 
                    ? 'bg-green-100 text-green-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  viewMode === 'timeline' 
                    ? 'bg-green-100 text-green-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Timeline
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditingList(!isEditingList)}
                className={`inline-flex items-center px-3 py-1 text-xs rounded-md transition-colors ${
                  isEditingList 
                    ? 'bg-green-100 text-green-800' 
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Edit3 className="w-3 h-3 mr-1" />
                {isEditingList ? 'Done Editing' : 'Edit Items'}
              </button>
            </div>
          </div>

          {/* Roadmap Content */}
          <div className="flex-1 overflow-y-auto">
            {viewMode === 'kanban' ? (
              <div className="space-y-3">
                {sortedItems.map((item, index) => (
                  <div key={item.id} className="relative">
                    <div 
                      className="bg-white border-2 rounded-lg p-3 hover:shadow-sm transition-shadow"
                      style={{ borderColor: item.color }}
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
                              <label className="block text-xs font-medium text-gray-700 mb-1">Progress (%)</label>
                              <input
                                type="number"
                                value={item.progress}
                                onChange={(e) => {
                                  const progress = Math.max(0, Math.min(100, Number(e.target.value)));
                                  const updatedItems = roadmapItems.map(i => 
                                    i.id === item.id ? { ...i, progress } : i
                                  );
                                  setRoadmapItems(updatedItems);
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs"
                                min="0"
                                max="100"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                              <div className="flex flex-wrap gap-1">
                                {colorOptions.slice(0, 4).map((color) => (
                                  <button
                                    key={color.value}
                                    onClick={() => {
                                      const updatedItems = roadmapItems.map(i => 
                                        i.id === item.id ? { ...i, color: color.value } : i
                                      );
                                      setRoadmapItems(updatedItems);
                                    }}
                                    className={`w-5 h-5 rounded-full border-2 ${color.class} ${
                                      item.color === color.value ? 'border-gray-800' : 'border-gray-300'
                                    } hover:border-gray-600 transition-colors`}
                                    title={color.label}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                              <input
                                type="date"
                                value={item.start_date || ''}
                                onChange={(e) => {
                                  const updatedItems = roadmapItems.map(i => 
                                    i.id === item.id ? { ...i, start_date: e.target.value || null } : i
                                  );
                                  setRoadmapItems(updatedItems);
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs"
                              />
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
                        // Display Mode
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                              {item.milestone && (
                                <Target className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                                {item.status.replace('_', ' ')}
                              </span>
                              {isEditingList && (
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
                              )}
                            </div>
                          </div>
                          
                          <p className="text-gray-600 text-xs mb-3 leading-relaxed">{item.description}</p>
                          
                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500">Progress</span>
                              <span className="text-xs font-medium text-gray-700">{item.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all ${getProgressColor(item.progress)}`}
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>

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

                    {/* Connection Line */}
                    {index < sortedItems.length - 1 && (
                      <div className="flex justify-center my-2">
                        <div className="w-0.5 h-4 bg-gray-300"></div>
                      </div>
                    )}
                  </div>
                ))}

                {/* New Roadmap Item Form */}
                {newRoadmapItem && (
                  <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">Add New Phase</h4>
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
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={newRoadmapItem.status || 'planned'}
                            onChange={(e) => setNewRoadmapItem(prev => ({ ...prev, status: e.target.value as any }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                          >
                            <option value="planned">Planned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Progress (%)</label>
                          <input
                            type="number"
                            value={newRoadmapItem.progress || 0}
                            onChange={(e) => {
                              const progress = Math.max(0, Math.min(100, Number(e.target.value)));
                              setNewRoadmapItem(prev => ({ ...prev, progress }));
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                            min="0"
                            max="100"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                          <div className="flex flex-wrap gap-1">
                            {colorOptions.slice(0, 4).map((color) => (
                              <button
                                key={color.value}
                                onClick={() => setNewRoadmapItem(prev => ({ ...prev, color: color.value }))}
                                className={`w-5 h-5 rounded-full border-2 ${color.class} ${
                                  newRoadmapItem.color === color.value ? 'border-gray-800' : 'border-gray-300'
                                } hover:border-gray-600 transition-colors`}
                                title={color.label}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={newRoadmapItem.start_date || ''}
                            onChange={(e) => setNewRoadmapItem(prev => ({ ...prev, start_date: e.target.value || null }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                          />
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

                {/* Add Phase Button */}
                {isEditingList && !newRoadmapItem && (
                  <button
                    onClick={() => setNewRoadmapItem({
                      title: '',
                      description: '',
                      status: 'planned',
                      progress: 0,
                      milestone: false,
                      color: '#3b82f6',
                      dependencies: [],
                    })}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add New Phase</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {sortedItems.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium text-gray-900 text-sm">{item.title}</span>
                        {item.milestone && (
                          <Target className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{item.progress}%</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {roadmapItems.length} phase{roadmapItems.length !== 1 ? 's' : ''} • {roadmapItems.filter(item => item.status === 'completed').length} completed
            </div>
            {!isEditingList && (
              <button 
                onClick={() => setIsEditingList(true)}
                className="text-xs px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Add Phase
              </button>
            )}
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};