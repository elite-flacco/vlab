import { Github, Loader2, Unlink } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { supabase, db } from '../../lib/supabase';
import { GITHUB_OAUTH_CONFIG, validateGitHubConfig } from '../../lib/github';

interface GitHubToken {
  id: string;
  github_username: string;
  token_scope: string[];
  created_at: string;
  updated_at: string;
}

interface GitHubAuthButtonProps {
  onAuthChange?: (isAuthenticated: boolean, username?: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const GitHubAuthButton: React.FC<GitHubAuthButtonProps> = ({ 
  onAuthChange, 
  className = '', 
  size = 'md' 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string>('');

  // Check if GitHub OAuth is configured
  const isConfigured = validateGitHubConfig();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    onAuthChange?.(isAuthenticated, githubUsername);
  }, [isAuthenticated, githubUsername, onAuthChange]);

  const checkAuthStatus = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthenticated(false);
        return;
      }

      const { data: tokenData, error } = await db.getGitHubToken(user.id);
      
      if (error || !tokenData) {
        setIsAuthenticated(false);
        setGithubUsername('');
      } else {
        setIsAuthenticated(true);
        setGithubUsername(tokenData.github_username || '');
      }
    } catch (err: any) {
      console.error('Error checking GitHub auth status:', err);
      setError('Failed to check GitHub connection status');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!isConfigured) {
      setError('GitHub integration is not configured. Please contact support.');
      return;
    }

    setConnecting(true);
    setError('');

    try {
      // Store state for OAuth callback verification
      const state = crypto.randomUUID();
      sessionStorage.setItem('github_oauth_state', state);
      
      // Build OAuth URL
      const params = new URLSearchParams({
        client_id: GITHUB_OAUTH_CONFIG.clientId,
        redirect_uri: `${window.location.origin}/auth/github/callback`,
        scope: GITHUB_OAUTH_CONFIG.scopes.join(' '),
        state,
      });
      
      const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
      
      // Open OAuth flow in a popup
      const popup = window.open(
        authUrl,
        'github-oauth',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Failed to open OAuth popup. Please allow popups for this site.');
      }

      // Listen for the OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GITHUB_OAUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          popup.close();
          
          // Refresh auth status
          await checkAuthStatus();
          setConnecting(false);
        } else if (event.data.type === 'GITHUB_OAUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          popup.close();
          setError(event.data.error || 'OAuth authentication failed');
          setConnecting(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Handle popup being closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setConnecting(false);
        }
      }, 1000);

    } catch (err: any) {
      console.error('Error connecting to GitHub:', err);
      setError(err.message || 'Failed to connect to GitHub');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await db.revokeGitHubToken(user.id);
      if (error) {
        throw error;
      }

      setIsAuthenticated(false);
      setGithubUsername('');
    } catch (err: any) {
      console.error('Error disconnecting from GitHub:', err);
      setError(err.message || 'Failed to disconnect from GitHub');
    } finally {
      setLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2';
    }
  };

  if (!isConfigured) {
    return (
      <div className={`text-center p-4 bg-yellow-50 border border-yellow-200 rounded-md ${className}`}>
        <p className="text-sm text-yellow-700">
          GitHub integration is not configured. Please contact support.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <button disabled className={`btn-outline ${getSizeClasses()} ${className}`}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </button>
    );
  }

  if (isAuthenticated) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Github className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">
              Connected as <strong>@{githubUsername}</strong>
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            className="btn-danger"
            title="Disconnect GitHub"
          >
            <Unlink className="w-3 h-3 mr-2" />
            <span>Disconnect</span>
          </button>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 bg-secondary border border-foreground-dim/20 rounded-lg p-4 ${className}`}>
      <button
        onClick={handleConnect}
        disabled={connecting}
        className={`filter-button-active py-4 ${getSizeClasses()} flex items-center justify-center w-full`}
      >
        {connecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Github className="w-4 h-4 mr-2" />
            Connect GitHub
          </>
        )}
      </button>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      <p className="text-xs text-foreground-dim">
        Connect your GitHub account to create issues directly from tasks.
      </p>
    </div>
  );
};