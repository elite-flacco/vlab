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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Folder className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">AI-Powered Kick-off</h3>
                <p className="text-sm text-blue-700 mt-1">
                  After creating your project, we'll guide you through an AI-powered setup to transform your idea into a structured workspace with PRDs, roadmaps, and tasks.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="btn btn-primary flex-1"
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