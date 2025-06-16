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
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-section">
            <div className="modal-icon-container">
              <Folder className="modal-icon" />
            </div>
            <h2 className="modal-title">Create New Project</h2>
          </div>
          <button
            onClick={handleClose}
            className="modal-close-btn"
          >
            <X className="modal-close-icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
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

          <div className="modal-info-section">
            <div className="modal-info-content">
              <Sparkles className="modal-info-icon" />
              <div>
                <h3 className="modal-info-title">AI-Powered Kick-off</h3>
                <p className="modal-info-description">
                  After creating your project, we'll guide you through an AI-powered setup to transform your idea into a structured workspace with PRDs, roadmaps, and tasks.
                </p>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-outline modal-action-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="btn btn-primary modal-action-btn modal-submit-btn"
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="btn-icon" />
                  <span>Create & Start Kick-off</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};