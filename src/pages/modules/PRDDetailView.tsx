import { format } from 'date-fns';
import { Calendar, Edit3, Eye, FileText, Save, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';
import { BackButton } from '../../components/common/BackButton';
import { db } from '../../lib/supabase';

export const PRDDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [prds, setPrds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPRD, setSelectedPRD] = useState<any>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPRD, setEditedPRD] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchPRDs(projectId);
    }
  }, [projectId]);

  // Sync editedPRD with selectedPRD when not editing
  useEffect(() => {
    if (selectedPRD && !isEditing) {
      setEditedPRD({ ...selectedPRD });
    }
  }, [selectedPRD, isEditing]);

  const fetchPRDs = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await db.getPRDs(id);
      if (fetchError) throw fetchError;
      setPrds(data || []);
      if (data && data.length > 0) {
        setSelectedPRD(data[0]); // Select the latest PRD by default
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch PRDs');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePRD = async () => {
    if (!editedPRD || saving) return;

    setSaving(true);
    setError(null);

    try {
      const { data, error: updateError } = await db.updatePRD(editedPRD.id, {
        title: editedPRD.title,
        content: editedPRD.content,
        status: editedPRD.status,
      });

      if (updateError) throw updateError;

      // Update local state
      const updatedPRDs = prds.map(prd =>
        prd.id === editedPRD.id ? data : prd
      );
      setPrds(updatedPRDs);
      setSelectedPRD(data);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save PRD');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedPRD({ ...selectedPRD });
    setIsEditing(false);
    setError(null);
  };

  const handleReturnToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const renderMarkdown = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-xl font-bold text-gray-900 mb-3">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-lg font-semibold text-gray-900 mb-2 mt-4">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-base font-medium text-gray-900 mb-2 mt-3">{line.slice(4)}</h3>;
        }
        if (line.startsWith('- ')) {
          return <li key={index} className="text-gray-700 mb-1 ml-4">{line.slice(2)}</li>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={index} className="font-semibold text-gray-900 mb-2">{line.slice(2, -2)}</p>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="text-gray-700 mb-2 text-sm leading-relaxed">{line}</p>;
      });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="PRD" type="prd">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading PRDs...</p>
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
        <ModuleContainer title="PRD" type="prd">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  if (prds.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="PRD" type="prd">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No PRDs Yet</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Create your first Product Requirements Document to get started.
              </p>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Create PRD
              </button>
            </div>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  const currentPRD = selectedPRD || prds[0];

  return (
    <div className="max-w-6xl mx-auto">
      <BackButton onClick={handleReturnToWorkspace} />

      <ModuleContainer title="PRD" type="prd">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <select
                value={currentPRD?.id || ''}
                onChange={(e) => {
                  const prd = prds.find(p => p.id === e.target.value);
                  setSelectedPRD(prd);
                  setIsEditing(false);
                }}
                disabled={isEditing}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                {prds.map((prd) => (
                  <option key={prd.id} value={prd.id}>
                    {prd.title} (v{prd.version})
                  </option>
                ))}
              </select>
              {currentPRD?.ai_generated && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  AI Generated
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {!isEditing && (
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title={isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
                >
                  {isPreviewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}

              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSavePRD}
                    disabled={saving}
                    className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
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
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* PRD Content */}
          <div className="flex-1 overflow-y-auto">
            {currentPRD && (
              <div className="space-y-4">
                {/* PRD Meta Info */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Updated {format(new Date(currentPRD.updated_at), 'MMM d, yyyy')}</span>
                      </span>
                      {isEditing ? (
                        <select
                          value={editedPRD?.status || 'draft'}
                          onChange={(e) => setEditedPRD(prev => ({ ...prev, status: e.target.value }))}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="draft">Draft</option>
                          <option value="review">Review</option>
                          <option value="approved">Approved</option>
                          <option value="archived">Archived</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentPRD.status === 'approved' ? 'bg-green-100 text-green-800' :
                            currentPRD.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {currentPRD.status}
                        </span>
                      )}
                    </div>
                    <span>Version {currentPRD.version}</span>
                  </div>
                </div>

                {/* PRD Title */}
                {isEditing ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={editedPRD?.title || ''}
                      onChange={(e) => setEditedPRD(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                      placeholder="PRD Title"
                    />
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">{currentPRD.title}</h1>
                )}

                {/* PRD Content */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  {isEditing ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                      <textarea
                        value={editedPRD?.content || ''}
                        onChange={(e) => setEditedPRD(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full h-96 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
                        placeholder="Edit your PRD content here..."
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Tip: Use markdown formatting (# for headings, - for bullets, **bold**)
                      </p>
                    </div>
                  ) : isPreviewMode ? (
                    <div className="prose prose-sm max-w-none">
                      {renderMarkdown(currentPRD.content)}
                    </div>
                  ) : (
                    <textarea
                      value={currentPRD.content}
                      readOnly
                      className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none bg-gray-50"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {prds.length} PRD{prds.length !== 1 ? 's' : ''} total
            </div>
            <div className="flex items-center space-x-2">
              <button className="text-xs px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                Export
              </button>
              <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                New Version
              </button>
            </div>
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};