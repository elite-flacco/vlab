import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { History, RotateCcw, GitCompare, Clock, User, FileText, X, Loader2, Check } from 'lucide-react';

// Component styles
const styles = `
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out forwards;
  }
  
  .animate-slideUp {
    animation: slideUp 0.25s ease-out forwards;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #1f1f1f;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #2a2a2a;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #3a3a3a;
  }
  
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Add styles to the document head
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

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

  const renderMarkdownPreview = (content: string, isComparison = false) => {
    // When in comparison mode, show all content with proper formatting
    if (isComparison) {
      return (
        <div className="prose prose-sm max-w-none text-foreground/80">
          {content.split('\n').map((line, index) => {
            if (line.startsWith('# ')) {
              return <h3 key={index} className="text-foreground font-semibold text-base mb-2 mt-4">{line.slice(2)}</h3>;
            }
            if (line.startsWith('## ')) {
              return <h4 key={index} className="text-foreground font-medium text-sm mb-2 mt-3">{line.slice(3)}</h4>;
            }
            if (line.startsWith('### ')) {
              return <h5 key={index} className="text-foreground font-medium text-sm mb-1 mt-2">{line.slice(4)}</h5>;
            }
            if (line.trim() === '') {
              return <div key={index} className="h-4" />;
            }
            // Handle lists
            if (line.trim().startsWith('- ')) {
              return <div key={index} className="flex"><span className="mr-2">•</span><span>{line.slice(2)}</span></div>;
            }
            return <p key={index} className="text-foreground/80 text-sm leading-relaxed mb-2">{line}</p>;
          })}
        </div>
      );
    }
    
    // For preview mode (non-comparison), show limited content
    return content
      .split('\n')
      .slice(0, 10) // Show first 10 lines
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return <h3 key={index} className="font-semibold text-foreground text-sm">{line.slice(2)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h4 key={index} className="font-medium text-foreground/90 text-sm">{line.slice(3)}</h4>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="text-foreground/80 text-xs leading-relaxed">{line}</p>;
      });
  };

  const renderComparison = () => {
    if (!comparisonData) return null;

    const { version_a_data, version_b_data } = comparisonData;

    const VersionCard = ({ versionData, isCurrent, isLeft = true }) => (
      <div className="space-y-4">
        <div className={`bg-foreground/5 border-l-4 ${isLeft ? 'border-primary/30' : 'border-secondary/30'} rounded-lg p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                Version {versionData.version}
                {isCurrent && (
                  <span className="ml-2 text-xs bg-primary text-background px-2 py-1 rounded-full">
                    Current
                  </span>
                )}
              </h3>
              <p className="text-sm text-foreground/60 mt-1">
                <Clock className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
                {format(new Date(versionData.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
            <div className="p-1.5 bg-foreground/10 rounded-md">
              <FileText className="w-4 h-4 text-foreground/80" />
            </div>
          </div>
        </div>
        <div className="bg-foreground/5 rounded-lg p-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          <h4 className="font-semibold text-foreground mb-3">{versionData.title}</h4>
          {renderMarkdownPreview(versionData.content, true)}
        </div>
      </div>
    );

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-background border border-foreground/10 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden animate-slideUp">
          <div className="flex items-center justify-between p-6 border-b border-foreground/10">
            <h2 className="text-xl font-bold text-foreground flex items-center">
              <GitCompare className="w-5 h-5 mr-3 text-primary" />
              Version Comparison
            </h2>
            <button
              onClick={() => setShowComparison(false)}
              className="p-2 text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-md transition-colors"
              aria-label="Close comparison"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 p-6 overflow-hidden">
            <VersionCard 
              versionData={version_a_data} 
              isCurrent={version_a_data.version === currentVersion} 
              isLeft={true} 
            />
            <VersionCard 
              versionData={version_b_data} 
              isCurrent={version_b_data.version === currentVersion} 
              isLeft={false} 
            />
          </div>
        </div>
      </div>
    );
  };

  if (loading && !versions.length) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-background rounded-xl shadow-2xl p-8">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-foreground-dim">Loading version history...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-background border border-foreground/10 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden animate-slideUp shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <History className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Version History</h2>
                <p className="text-sm text-foreground/60 mt-1">
                  {versions.length} version{versions.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {selectedVersions.length === 2 && (
                <button
                  onClick={handleCompareVersions}
                  disabled={loading}
                  className="btn-primary"
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare Versions
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-md transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-error/10 border border-error/20 rounded-md">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="px-6 py-3 bg-foreground/5 border-b border-border">
            <div className="flex items-center text-sm text-foreground/80">
              <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-foreground-dim text-sm">Select up to 2 versions to compare, or restore a previous version</p>
            </div>
          </div>

          {/* Version List */}
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar">
            <div className="p-6 space-y-4">
              {/* Current Version */}
              <div className="bg-foreground/5 border-l-4 border-primary/20 rounded-lg p-5 transition-all duration-200 hover:bg-foreground/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="mt-1">
                      <div className="relative flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={selectedVersions.includes(currentVersion)}
                          onChange={() => handleVersionSelect(currentVersion)}
                          className="h-4 w-4 rounded border border-foreground/30 bg-background/80 text-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 focus:ring-offset-background transition-all duration-200 cursor-pointer appearance-none checked:bg-primary checked:border-primary hover:border-primary/50 hover:ring-1 hover:ring-foreground/20"
                          aria-label={`Select version ${currentVersion}`}
                        />
                        {selectedVersions.includes(currentVersion) && (
                          <Check className="w-3 h-3 absolute left-0.5 top-0.5 text-background pointer-events-none" />
                        )}
                        <div className="absolute inset-0 rounded pointer-events-none border-2 border-transparent group-hover:border-primary/30 transition-colors" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Version {currentVersion} <span className="text-primary">(Current)</span>
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Active
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-foreground/60">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        <span>Last updated {format(new Date(versions[0]?.created_at || new Date()), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Versions */}
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-5 transition-all duration-200 bg-foreground/5 hover:bg-foreground/10 ${
                    selectedVersions.includes(version.version_number)
                      ? 'border-primary/30 shadow-sm'
                      : 'border-foreground/10 hover:border-foreground/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="mt-0.5">
                        <div className="relative flex items-center h-5 group">
                          <input
                            type="checkbox"
                            checked={selectedVersions.includes(version.version_number)}
                            onChange={() => handleVersionSelect(version.version_number)}
                            className={`h-4 w-4 rounded border border-foreground/30 bg-background/80 text-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 focus:ring-offset-background transition-all duration-200 cursor-pointer appearance-none checked:bg-primary checked:border-primary hover:border-primary/50 ${
                              selectedVersions.includes(version.version_number) ? 'ring-2 ring-primary/50 ring-offset-1 ring-offset-background' : 'hover:ring-1 hover:ring-foreground/20'
                            }`}
                            aria-label={`Select version ${version.version_number}`}
                          />
                          {selectedVersions.includes(version.version_number) && (
                            <Check className="w-3 h-3 absolute left-0.5 top-0.5 text-background pointer-events-none" />
                          )}
                          <div className="absolute inset-0 rounded pointer-events-none border-2 border-transparent group-hover:border-primary/30 transition-colors" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-foreground/10 rounded-md">
                              <FileText className="w-4 h-4 text-foreground/80" />
                            </div>
                            <span className="font-semibold text-foreground">
                              Version {version.version_number}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-foreground/60">
                            <Clock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                            <span>{format(new Date(version.created_at), 'MMM d, yyyy · h:mm a')}</span>
                          </div>
                        </div>

                        <h4 className="text-base font-medium text-foreground mb-1.5 line-clamp-1">
                          {version.title}
                        </h4>

                        {version.change_description && (
                          <p className="text-sm text-foreground-dim mb-3 py-2">
                            {version.change_description}
                          </p>
                        )}

                        {version.created_by_profile && (
                          <div className="flex items-center text-sm text-foreground/70 mt-2">
                            <div className="flex items-center bg-foreground/5 px-2.5 py-1 rounded-full border border-foreground/10">
                              <User className="w-3.5 h-3.5 mr-1.5 text-foreground/60" />
                              <span className="text-xs font-medium">{version.created_by_profile.name}</span>
                            </div>
                          </div>
                        )}

                        {/* Content Preview */}
                        <div className="mt-3 p-3 bg-foreground/5 rounded-md border border-foreground/10">
                          <div className="text-xs text-foreground/80 max-h-20 overflow-hidden relative">
                            <div className="absolute inset-0 pointer-events-none" style={{ height: '50%', bottom: 0 }} />
                            {renderMarkdownPreview(version.content)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-4">
                      <button
                        onClick={() => handleRestoreVersion(version.version_number)}
                        disabled={restoring === version.version_number}
                        className="btn-secondary"
                      >
                        {restoring === version.version_number ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Restoring...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restore Version
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {versions.length === 0 && (
                <div className="text-center py-12 px-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Version History</h3>
                  <p className="text-foreground/60 max-w-md mx-auto">
                    This PRD hasn't been modified yet. Version history will appear here after you make updates.
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