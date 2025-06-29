import { format } from 'date-fns';
import { ArrowLeft, Copy, Eye, EyeOff, Key, Lock, PenTool, Plus, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModuleContainer } from '../../components/Workspace/ModuleContainer';
import { BackButton } from '../../components/common/BackButton';
import { db } from '../../lib/supabase';

export const SecretsDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [secrets, setSecrets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchSecrets(projectId);
    }
  }, [projectId]);

  const fetchSecrets = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await db.getSecrets(id);
      if (fetchError) throw fetchError;
      setSecrets(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch secrets');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const categories = Array.from(new Set(secrets.map(secret => secret.category)));

  const filteredSecrets = secrets.filter(secret => {
    return !selectedCategory || secret.category === selectedCategory;
  });

  const toggleSecretVisibility = (secretId: string) => {
    const newVisible = new Set(visibleSecrets);
    if (newVisible.has(secretId)) {
      newVisible.delete(secretId);
    } else {
      newVisible.add(secretId);
    }
    setVisibleSecrets(newVisible);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'api_key': return <Key className="w-4 h-4" />;
      case 'database': return <Shield className="w-4 h-4" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'api_key': return 'bg-blue-100 text-blue-800';
      case 'database': return 'bg-green-100 text-green-800';
      case 'auth': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Secrets" type="secrets">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="loading-spinner"></div>
              <p className="mt-4 text-gray-600">Loading secrets...</p>
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
        <ModuleContainer title="Secrets" type="secrets">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  if (secrets.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={handleReturnToWorkspace} />
        <ModuleContainer title="Secrets" type="secrets">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>              <h2 className="mb-2">No Secrets Yet</h2>
              <p className="text-foreground-dim mb-4 text-sm mb-8">
                Securely store API keys, passwords, and other sensitive data.
              </p>
              <div className="mb-8 inline-flex items-center px-4 py-2 border border-dashed border-foreground/30 rounded-lg text-sm font-medium text-foreground bg-foreground/5">
                <PenTool className="w-4 h-4 mr-2" />
                <span>Coming Soon</span>
              </div>
            </div>
          </div>
        </ModuleContainer>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <BackButton onClick={handleReturnToWorkspace} />
      <ModuleContainer title="Secrets" type="secrets">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {categories.length > 0 && (
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Secrets List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredSecrets.map((secret) => (
              <div
                key={secret.id}
                className="card p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(secret.category)}
                    <h4 className="font-medium text-sm text-foreground">{secret.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(secret.category)}`}>
                      {secret.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleSecretVisibility(secret.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title={visibleSecrets.has(secret.id) ? 'Hide value' : 'Show value'}
                    >
                      {visibleSecrets.has(secret.id) ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {secret.description && (
                  <p className="text-xs text-gray-600 mb-2">{secret.description}</p>
                )}

                <div className="bg-gray-50 rounded-md p-2 mb-2">
                  <p className="text-xs text-gray-700 font-mono">
                    {visibleSecrets.has(secret.id)
                      ? '••••••••••••••••' // In real app, this would show decrypted value
                      : '••••••••••••••••'
                    }
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className={`w-2 h-2 rounded-full ${secret.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>{secret.is_active ? 'Active' : 'Inactive'}</span>
                    {secret.last_used_at && (
                      <span>Last used {format(new Date(secret.last_used_at), 'MMM d')}</span>
                    )}
                  </div>
                  <span>Added {format(new Date(secret.created_at), 'MMM d')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {filteredSecrets.length} of {secrets.length} secrets • {secrets.filter(s => s.is_active).length} active
            </div>
            <button className="text-xs px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
              Add Secret
            </button>
          </div>
        </div>
      </ModuleContainer>
    </div>
  );
};