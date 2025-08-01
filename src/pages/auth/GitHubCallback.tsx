import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const GitHubCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        throw new Error(`GitHub OAuth error: ${error}`);
      }

      if (!code) {
        throw new Error('No authorization code received from GitHub');
      }

      // Verify state parameter to prevent CSRF attacks
      const savedState = sessionStorage.getItem('github_oauth_state');
      if (!savedState || savedState !== state) {
        throw new Error('Invalid state parameter. Possible CSRF attack.');
      }

      // Clean up stored state
      sessionStorage.removeItem('github_oauth_state');

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated. Please log in first.');
      }

      // Exchange code for token via Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-oauth-exchange`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to exchange OAuth code');
      }

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        
        // Notify parent window (if opened in popup)
        if (window.opener) {
          window.opener.postMessage({
            type: 'GITHUB_OAUTH_SUCCESS',
            username: result.github_username,
            scopes: result.scopes,
          }, window.location.origin);
          window.close();
          return;
        }

        // If not in popup, redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error(result.error || 'OAuth exchange failed');
      }

    } catch (err: any) {
      console.error('GitHub OAuth callback error:', err);
      setError(err.message || 'OAuth authentication failed');
      setStatus('error');

      // Notify parent window of error (if opened in popup)
      if (window.opener) {
        window.opener.postMessage({
          type: 'GITHUB_OAUTH_ERROR',
          error: err.message || 'OAuth authentication failed',
        }, window.location.origin);
        setTimeout(() => window.close(), 3000);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="max-w-md w-full bg-secondary rounded-lg shadow-md p-6">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Connecting to GitHub
              </h2>
              <p className="text-foreground-dim">
                Please wait while we set up your GitHub integration...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                GitHub Connected Successfully!
              </h2>
              <p className="text-foreground-dim">
                Your GitHub account has been linked. You can now create issues directly from your tasks.
              </p>
              {!window.opener && (
                <p className="text-sm text-foreground-dim mt-4">
                  Redirecting to dashboard...
                </p>
              )}
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Connection Failed
              </h2>
              <p className="text-destructive mb-4">
                {error}
              </p>
              <button
                onClick={() => window.close()}
                className="btn-outline"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};