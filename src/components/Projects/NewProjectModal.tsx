import React, { useState } from 'react';
import { X, Folder, Sparkles } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description?: string) => void;
  loading?: boolean;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onCreate(formData.name.trim(), formData.description.trim() || undefined);
      setFormData({ name: '', description: '' });
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content scale-in">
        <div className="modal-header">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Folder className="w-5 h-5 text-primary" />
            </div>
            <h2 className="modal-title">Create New Project</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-foreground-dim hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="form-field">
            <label htmlFor="project-name" className="form-label">
              Project Name *
            </label>
            <input
              id="project-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your project name"
              className="form-input"
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="project-description" className="form-label">
              Description (Optional)
            </label>
            <textarea
              id="project-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Briefly describe what you're building..."
              rows={3}
              className="form-textarea"
            />
          </div>

          <div className="terminal-window p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">AI-Powered Kick-off</h3>
                <p className="text-sm text-foreground-dim">
                  After creating your project, we'll guide you through an AI-powered setup to transform your idea into a structured workspace with PRDs, roadmaps, and tasks.
                </p>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn-ghost"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || loading}
              className="btn-primary space-x-2"
            >
              {loading ? (
                <>
                  <div className="loading-spinner w-4 h-4"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Let's Go!</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};