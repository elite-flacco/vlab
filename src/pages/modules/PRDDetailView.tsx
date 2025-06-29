import { format } from 'date-fns';
import { ChevronDown, Clock, Edit3, Eye, FileText, GitBranch, History, Plus, Save, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackButton } from '../../components/common/BackButton';
import { VersionHistory } from '../../components/PRD/VersionHistory';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';
import { db } from '../../lib/supabase';

export const PRDDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [prds, setPrds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPRD, setSelectedPRD] = useState<any>(null); // Latest PRD from prds table
  const [allPRDVersions, setAllPRDVersions] = useState<any[]>([]); // All versions including current + historical
  const [selectedVersionData, setSelectedVersionData] = useState<any>(null); // Currently displayed version
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPRD, setEditedPRD] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchPRDs(projectId);
    }
  }, [projectId]);

  // Sync editedPRD with selectedVersionData when not editing
  useEffect(() => {
    if (selectedVersionData && !isEditing) {
      setEditedPRD({ ...selectedVersionData });
    }
  }, [selectedVersionData, isEditing]);

  const fetchPRDs = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await db.getPRDs(id);
      if (fetchError) throw fetchError;
      setPrds(data || []);
      if (data && data.length > 0) {
        const latestPRD = data[0]; // Select the latest PRD by default
        setSelectedPRD(latestPRD);
        await fetchAllVersionsForPRD(latestPRD);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch PRDs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllVersionsForPRD = async (prd: any) => {
    try {
      // Fetch historical versions
      const { data: historicalVersions, error: versionsError } = await db.getPRDVersions(prd.id);
      if (versionsError) throw versionsError;

      // Combine current PRD with historical versions
      const currentVersionData = {
        id: prd.id,
        version_number: prd.version,
        title: prd.title,
        content: prd.content,
        change_description: prd.change_description,
        created_by_profile: prd.created_by_profile,
        updated_by_profile: prd.updated_by_profile,
        created_at: prd.created_at,
        updated_at: prd.updated_at,
        status: prd.status,
        is_current: true
      };

      const allVersions = [currentVersionData, ...(historicalVersions || [])];
      setAllPRDVersions(allVersions);
      setSelectedVersionData(currentVersionData); // Initially show current version
    } catch (err: any) {
      setError(err.message || 'Failed to fetch PRD versions');
    }
  };

  const handleVersionSelect = async (versionNumber: number) => {
    if (!selectedPRD) return;

    try {
      const versionData = await db.getSpecificPRDVersion(selectedPRD.id, versionNumber);
      setSelectedVersionData(versionData);
      setIsEditing(false); // Exit edit mode when switching versions
    } catch (err: any) {
      setError(err.message || 'Failed to load version data');
    }
  };

  const handleSavePRD = async () => {
    if (!editedPRD || saving || !selectedPRD) return;

    setSaving(true);
    setError(null);

    try {
      const { data, error: updateError } = await db.updatePRD(selectedPRD.id, {
        title: editedPRD.title,
        content: editedPRD.content,
        status: editedPRD.status,
        change_description: editedPRD.change_description,
      });

      if (updateError) throw updateError;

      // Update local state
      const updatedPRDs = prds.map(prd =>
        prd.id === selectedPRD.id ? data : prd
      );
      setPrds(updatedPRDs);
      setSelectedPRD(data);
      
      // Refetch all versions to get the updated data
      await fetchAllVersionsForPRD(data);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save PRD');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedPRD({ ...selectedVersionData });
    setIsEditing(false);
    setError(null);
  };

  const handleVersionRestore = async (versionNumber: number, changeDescription?: string) => {
    if (!selectedPRD) return;

    setSaving(true);
    setError(null);

    try {
      const { data, error: restoreError } = await db.restorePRDVersion(
        selectedPRD.id,
        versionNumber,
        changeDescription
      );

      if (restoreError) throw restoreError;

      // Update local state
      const updatedPRDs = prds.map(prd =>
        prd.id === selectedPRD.id ? data : prd
      );
      setPrds(updatedPRDs);
      setSelectedPRD(data);
      
      // Refetch all versions to get the updated data
      await fetchAllVersionsForPRD(data);
      setShowVersionHistory(false);
    } catch (err: any) {
      setError(err.message || 'Failed to restore version');
    } finally {
      setSaving(false);
    }
  };

  const handleReturnToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const renderMarkdown = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-xl">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-lg">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-md">{line.slice(4)}</h3>;
        }
        if (line.startsWith('- ')) {
          return <li key={index} className="text-foreground-dim mb-1 ml-4">{line.slice(2)}</li>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={index} className="font-semibold text-foreground mb-2">{line.slice(2, -2)}</p>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="text-foreground-dim mb-2 text-sm leading-relaxed">{line}</p>;
      });
  };

  const isCurrentVersion = selectedVersionData?.is_current || selectedVersionData?.version_number === selectedPRD?.version;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="PRD" type="prd">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="loading-spinner"></div>
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
              <button className="btn-add mb-6">
                <Plus className="w-4 h-4 mr-2" />
                Create PRD
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

      <ModuleContainer title="PRD" type="prd">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {/* Version Selection Dropdown */}
              {allPRDVersions.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedVersionData?.version_number || ''}
                    onChange={(e) => handleVersionSelect(Number(e.target.value))}
                    disabled={isEditing}
                    className="form-select"
                  >
                    {allPRDVersions.map((version) => (
                      <option key={version.version_number} value={version.version_number}>
                        v{version.version_number}{version.is_current ? ' (Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedPRD?.ai_generated && (
                <span className="filter-button-active">
                  AI Generated
                </span>
              )}

              {!isCurrentVersion && (
                <span className="filter-button">
                  Historical Version
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Version History Button */}
              {selectedPRD && (
                <button
                  onClick={() => setShowVersionHistory(true)}
                  className="btn-secondary"
                >
                  <History className="w-3 h-3 mr-1" />
                  History
                </button>
              )}

              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSavePRD}
                    disabled={saving}
                    className="btn-primary"
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
                    className="btn-outline"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={!isCurrentVersion}
                  className="btn-secondary"
                  title={!isCurrentVersion ? 'Can only edit the current version' : 'Edit PRD'}
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* PRD Content */}
          <div className="flex-1 overflow-y-auto">
            {selectedVersionData && (
              <div className="space-y-4">
                {/* PRD Meta Info with Version Details */}
                <div className="card">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="flex items-center space-x-2">
                      <GitBranch className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Version {selectedVersionData.version_number}
                        </p>
                        <p className="text-xs text-foreground-dim">
                          {isCurrentVersion ? 'Current' : 'Historical'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Last Modified</p>
                        <p className="text-xs text-foreground-dim">
                          {format(new Date(selectedVersionData.updated_at || selectedVersionData.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {isCurrentVersion ? 'Updated By' : 'Created By'}
                        </p>
                        <p className="text-xs text-foreground-dim">
                          {(selectedVersionData.updated_by_profile?.name || selectedVersionData.created_by_profile?.name) || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedVersionData.change_description && (
                    <div className="mt-3 pt-3 border-t border-foreground-dim/20">
                      <p className="text-xs font-medium text-foreground mb-1">
                        {isCurrentVersion ? 'Latest Changes:' : 'Changes in this version:'}
                      </p>
                      <p className="text-xs text-foreground-dim">{selectedVersionData.change_description}</p>
                    </div>
                  )}
                </div>

                {/* PRD Title */}
                {isEditing ? (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                    <input
                      type="text"
                      value={editedPRD?.title || ''}
                      onChange={(e) => setEditedPRD(prev => ({ ...prev, title: e.target.value }))}
                      className="form-input"
                      placeholder="PRD Title"
                    />
                  </div>
                ) : (
                  <h1 className="text-xl">{selectedVersionData.title}</h1>
                )}

                {/* Change Description (only when editing) */}
                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Change Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={editedPRD?.change_description || ''}
                      onChange={(e) => setEditedPRD(prev => ({ ...prev, change_description: e.target.value }))}
                      className="form-input"
                      placeholder="Briefly describe what changed in this version..."
                    />
                  </div>
                )}

                {/* PRD Content */}
                <div className="card">
                  {isEditing ? (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Content</label>
                      <textarea
                        value={editedPRD?.content || ''}
                        onChange={(e) => setEditedPRD(prev => ({ ...prev, content: e.target.value }))}
                        className="form-textarea"
                        placeholder="Edit your PRD content here..."
                      />
                      <p className="text-xs text-foreground-dim mt-2">
                        Tip: Use markdown formatting (# for headings, - for bullets, **bold**)
                      </p>
                    </div>
                  ) : isPreviewMode ? (
                    <div className="card-content">
                      {renderMarkdown(selectedVersionData.content)}
                    </div>
                  ) : (
                    <textarea
                      value={selectedVersionData.content}
                      readOnly
                      className="card-content"
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
              {selectedVersionData && (
                <span className="ml-2">
                  • Version {selectedVersionData.version_number}
                  • {allPRDVersions.length} version{allPRDVersions.length !== 1 ? 's' : ''} available
                </span>
              )}
            </div>
            {/* <div className="flex items-center space-x-2">
              <button className="text-xs px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                Export
              </button>
            </div> */}
          </div>
        </div>
      </ModuleContainer>

      {/* Version History Modal */}
      {showVersionHistory && selectedPRD && (
        <VersionHistory
          prdId={selectedPRD.id}
          currentVersion={selectedPRD.version}
          onVersionRestore={handleVersionRestore}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </div>
  );
};