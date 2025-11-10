import {
  ChevronDown,
  ExternalLink,
  Github,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { supabase, db } from "../../lib/supabase";
import { createGitHubClient, GitHubRepository } from "../../lib/github";

interface GitHubRepo {
  id: string;
  repo_owner: string;
  repo_name: string;
  repo_full_name: string;
  repo_url: string;
  default_branch: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface GitHubRepositorySelectorProps {
  projectId: string;
  selectedRepositoryId?: string;
  onRepositorySelect: (repository: GitHubRepo | null) => void;
  className?: string;
}

export const GitHubRepositorySelector: React.FC<
  GitHubRepositorySelectorProps
> = ({
  projectId,
  selectedRepositoryId,
  onRepositorySelect,
  className = "",
}) => {
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [availableRepos, setAvailableRepos] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string>("");
  const [hasGitHubAuth, setHasGitHubAuth] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const checkGitHubAuth = async () => {
    setCheckingAuth(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setHasGitHubAuth(false);
        return;
      }

      const { data: tokenData } = await db.getGitHubToken(user.id);
      setHasGitHubAuth(!!tokenData);
    } catch (err) {
      console.error("Error checking GitHub auth:", err);
      setHasGitHubAuth(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchRepositories = useCallback(
    async (force = false) => {
      // Only show loading if we haven't loaded before or if forced
      if (force || !hasInitiallyLoaded) {
        setLoading(true);
      }
      setError("");

      try {
        const { data, error } = await db.getGitHubRepositories(projectId);
        if (error) throw error;

        setRepositories(data || []);

        // Auto-select first repository if none selected
        if (!selectedRepositoryId && data && data.length > 0) {
          onRepositorySelect(data[0]);
        }
      } catch (err: Error | unknown) {
        console.error("Error fetching repositories:", err);
        setError("Failed to load GitHub repositories");
      } finally {
        setLoading(false);
        setHasInitiallyLoaded(true);
      }
    },
    [projectId, selectedRepositoryId, onRepositorySelect, hasInitiallyLoaded],
  );

  useEffect(() => {
    setHasInitiallyLoaded(false);
    setCheckingAuth(true);
    fetchRepositories(true);
    checkGitHubAuth();
  }, [projectId, fetchRepositories]);

  useEffect(() => {
    // Clear selections when auth status changes
    if (!hasGitHubAuth) {
      setRepositories([]);
      onRepositorySelect(null);
    }
  }, [hasGitHubAuth, onRepositorySelect]);

  const fetchAvailableRepositories = async () => {
    if (!hasGitHubAuth) return;

    setLoadingAvailable(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: tokenData } = await db.getGitHubTokenWithSecret(user.id);
      if (!tokenData) throw new Error("No GitHub token found");

      // Decrypt token (simple base64 - in production use proper decryption)
      if (!tokenData.encrypted_token) {
        throw new Error("No encrypted token found");
      }
      const accessToken = atob(tokenData.encrypted_token);
      const githubClient = createGitHubClient(accessToken);

      const repos = await githubClient.getUserRepositories(1, 100);

      // Filter out repositories that are already added to this project
      const existingRepoNames = repositories.map((r) => r.repo_full_name);
      const availableRepos = repos.filter(
        (repo) =>
          !existingRepoNames.includes(repo.full_name) && repo.permissions.push, // Only show repos where user has push access
      );

      setAvailableRepos(availableRepos);
    } catch (err: Error | unknown) {
      console.error("Error fetching available repositories:", err);
      setError("Failed to load available repositories from GitHub");
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleAddRepository = async (githubRepo: GitHubRepository) => {
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const repoData = {
        project_id: projectId,
        user_id: user.id,
        repo_owner: githubRepo.owner.login,
        repo_name: githubRepo.name,
        repo_full_name: githubRepo.full_name,
        repo_url: githubRepo.html_url,
        default_branch: githubRepo.default_branch,
        is_active: true,
      };

      const { data, error } = await db.createGitHubRepository(repoData);
      if (error) throw error;

      // Refresh the repositories list
      await fetchRepositories(true);

      // Select the newly added repository
      onRepositorySelect(data);

      // Close the add dialog
      setShowAddRepo(false);
    } catch (err: Error | unknown) {
      console.error("Error adding repository:", err);
      setError(err instanceof Error ? err.message : "Failed to add repository");
    }
  };

  const filteredAvailableRepos = availableRepos.filter(
    (repo) =>
      repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedRepo = repositories.find((r) => r.id === selectedRepositoryId);

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-foreground-dim">
          Checking GitHub connection...
        </span>
      </div>
    );
  }

  if (!hasGitHubAuth) {
    return (
      <div
        className={`p-4 bg-secondary border border-foreground-dim/20 rounded-md ${className}`}
      >
        <p className="text-sm text-foreground-dim mb-2">
          Connect your GitHub account to link repositories to this project.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-foreground-dim">
          Loading repositories...
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {repositories.length === 0 ? (
        <div className="text-center p-4 bg-secondary border-2 border-dashed border-foreground/20 rounded-md">
          <Github className="w-8 h-8 text-foreground-dim mx-auto mb-2" />
          <p className="text-sm text-foreground-dim mb-3">
            No repositories linked to this project
          </p>
          <button
            onClick={() => {
              setShowAddRepo(true);
              fetchAvailableRepositories();
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Repository
          </button>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-foreground">
              GitHub Repository
            </label>
            <button
              onClick={() => {
                setShowAddRepo(true);
                fetchAvailableRepositories();
              }}
              className="btn-primary"
            >
              <Plus className="w-3 h-3" />
              <span>Add Repository</span>
            </button>
          </div>

          <div className="relative">
            <select
              value={selectedRepositoryId || ""}
              onChange={(e) => {
                const repo = repositories.find((r) => r.id === e.target.value);
                onRepositorySelect(repo || null);
              }}
              className="form-select w-full pr-10"
            >
              <option value="">Select a repository...</option>
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.repo_full_name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-dim pointer-events-none" />
          </div>

          {selectedRepo && (
            <div className="flex items-center justify-between text-xs text-foreground-dim bg-secondary/50 p-2 rounded">
              <span>Default branch: {selectedRepo.default_branch}</span>
              <a
                href={selectedRepo.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Add Repository Modal */}
      {showAddRepo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary rounded-lg shadow-xl max-w-md w-full max-h-96 flex flex-col">
            <div className="p-4">
              <h3 className="text-lg font-medium">Add GitHub Repository</h3>
              <p className="text-sm text-foreground-dim mt-1">
                Select a repository to link to this project
              </p>
            </div>

            <div className="p-4 border-b border-foreground-dim/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-dim" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingAvailable ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-foreground-dim" />
                  <span className="ml-2 text-sm text-foreground-dim">
                    Loading repositories...
                  </span>
                </div>
              ) : filteredAvailableRepos.length === 0 ? (
                <div className="text-center py-8">
                  <Github className="w-8 h-8 text-foreground-dim mx-auto mb-2" />
                  <p className="text-sm text-foreground-dim">
                    {searchTerm
                      ? "No repositories match your search"
                      : "No repositories available"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between p-3 bg-secondary/30 text-foreground-dim border border-foreground-dim/20 rounded-md hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground-dim hover:text-primary truncate">
                          {repo.full_name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-foreground/40">
                          <span>{repo.private ? "Private" : "Public"}</span>
                          <span>•</span>
                          <span>{repo.default_branch}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddRepository(repo)}
                        className="filter-button-active hover:bg-primary/50 hover:text-primary hover:border-primary/20"
                      >
                        <Plus className="w-4 h-4 font-bold" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-foreground-dim/20">
              <button
                onClick={() => setShowAddRepo(false)}
                className="w-full btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
