import { ChevronDown, ExternalLink, Github, Loader2, Plus, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { supabase, db } from '../../lib/supabase';
import { createGitHubClient, GitHubRepository } from '../../lib/github';

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

export const GitHubRepositorySelector: React.FC<GitHubRepositorySelectorProps> = ({
  projectId,
  selectedRepositoryId,
  onRepositorySelect,
  className = '',
}) => {
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [availableRepos, setAvailableRepos] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string>('');
  const [hasGitHubAuth, setHasGitHubAuth] = useState(false);

  useEffect(() => {
    fetchRepositories();
    checkGitHubAuth();
  }, [projectId]);

  const checkGitHubAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tokenData } = await db.getGitHubToken(user.id);
      setHasGitHubAuth(!!tokenData);
    } catch (err) {
      console.error('Error checking GitHub auth:', err);
      setHasGitHubAuth(false);
    }
  };

  const fetchRepositories = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await db.getGitHubRepositories(projectId);
      if (error) throw error;

      setRepositories(data || []);

      // Auto-select first repository if none selected
      if (!selectedRepositoryId && data && data.length > 0) {
        onRepositorySelect(data[0]);
      }
    } catch (err: any) {
      console.error('Error fetching repositories:', err);
      setError('Failed to load GitHub repositories');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRepositories = async () => {
    if (!hasGitHubAuth) return;

    setLoadingAvailable(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: tokenData } = await db.getGitHubToken(user.id);
      if (!tokenData) throw new Error('No GitHub token found');

      // Decrypt token (simple base64 - in production use proper decryption)
      const accessToken = atob(tokenData.encrypted_token);
      const githubClient = createGitHubClient(accessToken);

      const repos = await githubClient.getUserRepositories(1, 100);
      
      // Filter out repositories that are already added to this project
      const existingRepoNames = repositories.map(r => r.repo_full_name);
      const availableRepos = repos.filter(repo => 
        !existingRepoNames.includes(repo.full_name) &&
        repo.permissions.push // Only show repos where user has push access
      );

      setAvailableRepos(availableRepos);
    } catch (err: any) {
      console.error('Error fetching available repositories:', err);
      setError('Failed to load available repositories from GitHub');
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleAddRepository = async (githubRepo: GitHubRepository) => {
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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
      await fetchRepositories();
      
      // Select the newly added repository
      onRepositorySelect(data);
      
      // Close the add dialog
      setShowAddRepo(false);
    } catch (err: any) {
      console.error('Error adding repository:', err);
      setError(err.message || 'Failed to add repository');
    }
  };

  const filteredAvailableRepos = availableRepos.filter(repo =>
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRepo = repositories.find(r => r.id === selectedRepositoryId);

  if (!hasGitHubAuth) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-md ${className}`}>
        <p className="text-sm text-yellow-700 mb-2">
          Connect your GitHub account to link repositories to this project.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-500">Loading repositories...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {repositories.length === 0 ? (
        <div className="text-center p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-md">
          <Github className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-3">No repositories linked to this project</p>
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              GitHub Repository
            </label>
            <button
              onClick={() => {
                setShowAddRepo(true);
                fetchAvailableRepositories();
              }}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Repository</span>
            </button>
          </div>

          <div className="relative">
            <select
              value={selectedRepositoryId || ''}
              onChange={(e) => {
                const repo = repositories.find(r => r.id === e.target.value);
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
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {selectedRepo && (
            <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <span>Default branch: {selectedRepo.default_branch}</span>
              <a
                href={selectedRepo.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">Add GitHub Repository</h3>
              <p className="text-sm text-gray-600 mt-1">
                Select a repository to link to this project
              </p>
            </div>

            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingAvailable ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading repositories...</span>
                </div>
              ) : filteredAvailableRepos.length === 0 ? (
                <div className="text-center py-8">
                  <Github className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {searchTerm ? 'No repositories match your search' : 'No repositories available'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {repo.full_name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{repo.private ? 'Private' : 'Public'}</span>
                          <span>•</span>
                          <span>{repo.default_branch}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddRepository(repo)}
                        className="ml-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => setShowAddRepo(false)}
                className="w-full btn-outline"
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