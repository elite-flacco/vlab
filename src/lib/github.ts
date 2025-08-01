import { withTimeout, withTiming } from './utils';

// GitHub API configuration
const GITHUB_API_BASE_URL = 'https://api.github.com';
const API_TIMEOUT = 10000; // 10 seconds

export interface GitHubRepository {
  id: number;
  full_name: string;
  name: string;
  owner: {
    login: string;
  };
  html_url: string;
  default_branch: string;
  private: boolean;
  permissions: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

export interface GitHubIssue {
  number: number;
  title: string;
  body?: string;
  html_url: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface CreateIssueRequest {
  title: string;
  body?: string;
  assignees?: string[];
  labels?: string[];
  milestone?: number;
}

class GitHubAPIClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${GITHUB_API_BASE_URL}${endpoint}`;
    
    const operation = async () => {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'VLab-GitHub-Integration/1.0',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}. ${
            errorData.message || 'Unknown error'
          }`
        );
      }

      return response.json();
    };

    return withTimeout(
      withTiming(`GitHub API ${endpoint}`, operation),
      API_TIMEOUT,
      `GitHub API request to ${endpoint} timed out`
    );
  }

  // Get authenticated user information
  async getUser() {
    return this.request<{ login: string; id: number; name: string; email: string }>('/user');
  }

  // Get user's repositories
  async getUserRepositories(page: number = 1, perPage: number = 30): Promise<GitHubRepository[]> {
    return this.request<GitHubRepository[]>(
      `/user/repos?sort=updated&direction=desc&page=${page}&per_page=${perPage}`
    );
  }

  // Get repositories for an organization
  async getOrgRepositories(org: string, page: number = 1, perPage: number = 30): Promise<GitHubRepository[]> {
    return this.request<GitHubRepository[]>(
      `/orgs/${org}/repos?sort=updated&direction=desc&page=${page}&per_page=${perPage}`
    );
  }

  // Get a specific repository
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.request<GitHubRepository>(`/repos/${owner}/${repo}`);
  }

  // Create an issue in a repository
  async createIssue(owner: string, repo: string, issue: CreateIssueRequest): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(`/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      body: JSON.stringify(issue),
    });
  }

  // Get an issue from a repository
  async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(`/repos/${owner}/${repo}/issues/${issueNumber}`);
  }

  // Update an issue in a repository
  async updateIssue(owner: string, repo: string, issueNumber: number, updates: Partial<CreateIssueRequest>): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(`/repos/${owner}/${repo}/issues/${issueNumber}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Check if token is valid
  async validateToken(): Promise<boolean> {
    try {
      await this.getUser();
      return true;
    } catch (error) {
      console.error('GitHub token validation failed:', error);
      return false;
    }
  }
}

// Helper functions for GitHub integration

// Create a GitHub API client instance
export const createGitHubClient = (token: string): GitHubAPIClient => {
  return new GitHubAPIClient(token);
};

// Parse repository full name into owner and repo
export const parseRepoFullName = (fullName: string): { owner: string; repo: string } => {
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid repository full name: ${fullName}`);
  }
  return { owner, repo };
};

// Format task data for GitHub issue creation
export const formatTaskAsIssue = (task: {
  title: string;
  description?: string;
  tags?: string[];
  priority?: string;
  status?: string;
  due_date?: string;
}): CreateIssueRequest => {
  let body = '';
  
  if (task.description) {
    body += `${task.description}`;
  }
  
  body += `\n\n*@claude please implement*`;

  return {
    title: task.title,
    body,
  };
};

// GitHub OAuth configuration
export const GITHUB_OAUTH_CONFIG = {
  clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
  scopes: ['repo', 'user:email'], // Required scopes for creating issues
  redirectUri: `${window.location.origin}/auth/github/callback`,
  
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      state: crypto.randomUUID(), // CSRF protection
    });
    
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  },
};

// Validate GitHub OAuth configuration
export const validateGitHubConfig = (): boolean => {
  return Boolean(GITHUB_OAUTH_CONFIG.clientId);
};

export default GitHubAPIClient;