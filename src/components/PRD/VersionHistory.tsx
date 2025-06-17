import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { History, Eye, RotateCcw, GitCompare, Clock, User, FileText, X, Loader2 } from 'lucide-react';
import { db } from '../../lib/supabase';

interface PRDVersion {
  id: string;
  version_number: number;
  title: string;
  content: string;
  change_description?: string;
  created_by_profile?: { name: string; email: string };
  created_at: string;
}

interface VersionHistoryProps {
  prdId: string;
  currentVersion: number;
  onVersionRestore: (versionNumber: number, changeDescription?: string) => Promise<void>;
  onClose: () => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  prdId,
  currentVersion,
  onVersionRestore,
  onClose
}) => {
  const [versions, setVersions] = useState<PRDVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [prdId]);

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await db.getPRDVersions(prdId);
      if (fetchError) throw fetchError;
      setVersions(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch version history');
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = (versionNumber: number) => {
    if (selectedVersions.includes(versionNumber)) {
      setSelectedVersions(selectedVersions.filter(v => v !== versionNumber));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionNumber]);
    } else {
      // Replace the first selected version
      setSelectedVersions([selectedVersions[1], versionNumber]);
    }
  };

  const handleCompareVersions = async () => {
    if (selectedVersions.length !== 2) return;

    setLoading(true);
    try {
      const [versionA, versionB] = selectedVersions.sort((a, b) => b - a); // Newer first
      const { data, error: compareError } = await db.getPRDVersionComparison(
        prdId,
        versionA,
        versionB
      );
      
      if (compareError) throw compareError;
      setComparisonData(data[0]);
      setShowComparison(true);
    } catch (err: any) {
      setError(err.message || 'Failed to compare versions');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    const changeDescription = prompt(
      `Describe the reason for restoring to version ${versionNumber}:`
    );
    
    if (changeDescription === null) return; // User cancelled

    setRestoring(versionNumber);
    try {
      await onVersionRestore(versionNumber, changeDescription || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to restore version');
    } finally {
      setRestoring(null);
    }
  };

  const renderMarkdownPreview = (content: string) => {
    return content
      .split('\n')
      .slice(0, 10) // Show first 10 lines
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return <h3 key={index} className="font-semibold text-gray-900 text-sm">{line.slice(2)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h4 key={index} className="font-medium text-gray-800 text-sm">{line.slice(3)}</h4>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="text-gray-700 text-xs leading-relaxed">{line}</p>;
      });
  };

  const renderComparison = () => {
    if (!comparisonData) return null;

    const { version_a_data, version_b_data } = comparisonData;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <GitCompare className="w-5 h-5 mr-2" />
              Version Comparison
            </h2>
            <button
              onClick={() => setShowComparison(false)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Version A */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Version {version_a_data.version}
                  {version_a_data.version === currentVersion && (
                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </h3>
                <p className="text-sm text-blue-700">
                  {format(new Date(version_a_data.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <h4 className="font-medium text-gray-900 mb-2">{version_a_data.title}</h4>
                <div className="prose prose-sm max-w-none">
                  {renderMarkdownPreview(version_a_data.content)}
                </div>
              </div>
            </div>

            {/* Version B */}
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">
                  Version {version_b_data.version}
                  {version_b_data.version === currentVersion && (
                    <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </h3>
                <p className="text-sm text-green-700">
                  {format(new Date(version_b_data.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <h4 className="font-medium text-gray-900 mb-2">{version_b_data.title}</h4>
                <div className="prose prose-sm max-w-none">
                  {renderMarkdownPreview(version_b_data.content)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !versions.length) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-700">Loading version history...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <History className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Version History</h2>
                <p className="text-sm text-gray-600">
                  {versions.length} version{versions.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {selectedVersions.length === 2 && (
                <button
                  onClick={handleCompareVersions}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <p className="text-sm text-blue-700">
              Select up to 2 versions to compare, or click the restore button to revert to a previous version.
            </p>
          </div>

          {/* Version List */}
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="p-6 space-y-4">
              {/* Current Version */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedVersions.includes(currentVersion)}
                      onChange={() => handleVersionSelect(currentVersion)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-900">
                        Version {currentVersion} (Current)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Historical Versions */}
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedVersions.includes(version.version_number)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedVersions.includes(version.version_number)}
                        onChange={() => handleVersionSelect(version.version_number)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            Version {version.version_number}
                          </span>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                        </div>

                        <h4 className="font-medium text-gray-900 mb-1 truncate">
                          {version.title}
                        </h4>

                        {version.change_description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {version.change_description}
                          </p>
                        )}

                        {version.created_by_profile && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            <span>by {version.created_by_profile.name}</span>
                          </div>
                        )}

                        {/* Content Preview */}
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <div className="text-xs text-gray-700 max-h-20 overflow-hidden">
                            {renderMarkdownPreview(version.content)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleRestoreVersion(version.version_number)}
                        disabled={restoring === version.version_number}
                        className="inline-flex items-center px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors text-sm"
                      >
                        {restoring === version.version_number ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Restoring...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restore
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {versions.length === 0 && (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Version History</h3>
                  <p className="text-gray-500">
                    This PRD hasn't been modified yet. Version history will appear here after updates.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      {showComparison && renderComparison()}
    </>
  );
};