import { ExternalLink, Github, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { supabase, db } from '../../lib/supabase';
import { formatTaskAsIssue } from '../../lib/github';
import { GitHubAuthButton } from './GitHubAuthButton';
import { GitHubRepositorySelector } from './GitHubRepositorySelector';

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  tags?: string[];
  due_date?: string;
}

interface GitHubRepo {
  id: string;
  repo_owner: string;
  repo_name: string;
  repo_full_name: string;
  repo_url: string;
  default_branch: string;
}

interface GitHubIssue {
  id: string;
  github_issue_number: number;
  github_issue_url: string;
  issue_title: string;
  github_issue_state: string;
  created_at: string;
}

interface GitHubIssueCreatorProps {
  task: TaskItem;
  projectId: string;
  onIssueCreated?: (issue: GitHubIssue) => void;
  className?: string;
}

export const GitHubIssueCreator: React.FC<GitHubIssueCreatorProps> = ({
  task,
  projectId,
  onIssueCreated,
  className = '',
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRepository, setSelectedRepository] = useState<GitHubRepo | null>(null);
  const [existingIssue, setExistingIssue] = useState<GitHubIssue | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [useCustomContent, setUseCustomContent] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const initializeComponent = async () => {
      await checkExistingIssue();
      setInitialLoading(false);
    };
    initializeComponent();
  }, [task.id]);

  useEffect(() => {
    if (!useCustomContent) {
      setCustomTitle(task.title);
      const formatted = formatTaskAsIssue(task);
      setCustomBody(formatted.body || '');
    }
  }, [task, useCustomContent]);

  const checkExistingIssue = async () => {
    try {
      const { data, error } = await db.getGitHubIssueByTask(task.id);
      if (!error && data) {
        setExistingIssue(data);
      }
    } catch (err) {
      // Issue doesn't exist, which is fine
      setExistingIssue(null);
    }
  };

  const handleCreateIssue = async () => {
    if (!selectedRepository) {
      setError('Please select a repository');
      return;
    }

    if (!customTitle.trim()) {
      setError('Please provide a title for the issue');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call the Edge Function to create the issue
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-create-issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          repositoryId: selectedRepository.id,
          title: customTitle.trim(),
          body: customBody.trim(),
          labels: formatTaskAsIssue(task).labels,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create GitHub issue');
      }

      const result = await response.json();
      
      if (result.success) {
        const newIssue = result.dbRecord;
        setExistingIssue(newIssue);
        onIssueCreated?.(newIssue);
      } else {
        throw new Error(result.error || 'Failed to create GitHub issue');
      }

    } catch (err: any) {
      console.error('Error creating GitHub issue:', err);
      setError(err.message || 'Failed to create GitHub issue');
    } finally {
      setCreating(false);
    }
  };

  // Show single loading state during initial check
  if (initialLoading) {
    return (
      <div className={`p-4 bg-secondary rounded-lg flex items-center justify-center ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm text-foreground-dim">Loading...</span>
      </div>
    );
  }

  // If there's already an issue for this task, show the existing issue info
  if (existingIssue) {
    return (
      <div className={`p-4 bg-primary/5 border border-primary/20 rounded-md ${className}`}>
        <div className="flex items-start space-x-3">
          <Github className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-primary">
              GitHub Issue Created
            </h4>
            <p className="text-sm text-primary mt-1">
              This task is linked to GitHub issue #{existingIssue.github_issue_number}
            </p>
            <div className="mt-2">
              <a
                href={existingIssue.github_issue_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1"
              >
                <span className="text-xs">View Issue</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 bg-secondary rounded-lg ${className}`}>
      {/* <div className="flex items-center space-x-2">
        <Github className="w-5 h-5" />
        <h3 className="text-lg font-medium">Create GitHub Issue</h3>
      </div> */}

      {/* GitHub Authentication */}
      <GitHubAuthButton
        onAuthChange={(authenticated, username) => setIsAuthenticated(authenticated)}
        size="sm"
        skipInitialLoading={false}
      />

      {isAuthenticated && (
        <>
          {/* Repository Selection */}
          <GitHubRepositorySelector
            projectId={projectId}
            selectedRepositoryId={selectedRepository?.id}
            onRepositorySelect={setSelectedRepository}
          />

          {selectedRepository && (
            <div className="space-y-4 border-t pt-4 border-foreground-dim/20">
              {/* Issue Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">
                    Issue Content
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={useCustomContent}
                      onChange={(e) => setUseCustomContent(e.target.checked)}
                      className="form-checkbox"
                    />
                    <span className="text-foreground-dim text-xs">Customize content</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground-dim mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    disabled={!useCustomContent}
                    className="form-input w-full"
                    placeholder="Issue title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground-dim mb-1">
                    Description
                  </label>
                  <textarea
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    disabled={!useCustomContent}
                    rows={6}
                    className="form-textarea w-full"
                    placeholder="Issue description and details"
                  />
                </div>

                {!useCustomContent && (
                  <p className="text-xs text-foreground-dim">
                    Content is automatically generated from task details. Check "Customize content" to edit.
                  </p>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Create Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleCreateIssue}
                  disabled={creating || !customTitle.trim()}
                  className="btn-primary"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Issue...
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4 mr-2" />
                      Create GitHub Issue
                    </>
                  )}
                </button>
              </div>

              {/* Preview */}
              <div className="border-t pt-4 mt-8 border-foreground-dim/20">
                <h4 className="text-sm font-medium text-foreground mb-2">Preview</h4>
                <div className="bg-foreground/5 border border-foreground/10 rounded-md p-3">
                  <div className="text-sm">
                    <strong>{selectedRepository.repo_full_name}</strong> → New Issue
                  </div>
                  <div className="mt-2">
                    <div className="font-medium text-sm">{customTitle}</div>
                    {customBody && (
                      <div className="text-xs text-foreground-dim mt-1 line-clamp-3">
                        {customBody}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};