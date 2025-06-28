import React, { useState } from 'react';
import { X, Upload, Tag, Loader2, Plus, AlertCircle } from 'lucide-react';
import { communityApi } from '../../lib/communityApi';

interface PostSubmissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Tool options for the dropdown
const TOOL_OPTIONS = [
  { value: 'bolt', label: 'Bolt' },
  { value: 'loveable', label: 'Loveable' },
  { value: 'replit', label: 'Replit' },
  { value: 'v0', label: 'V0' },
  { value: 'other', label: 'Other' },
];

// Category options for tips
const TIP_CATEGORY_OPTIONS = [
  { value: 'prompt_tricks', label: 'Prompt Tricks' },
  { value: 'integrations', label: 'Integrations' },
  { value: 'authentication', label: 'Authentication' },
  { value: 'payment', label: 'Payment' },
  { value: 'other', label: 'Other' },
];

export const PostSubmissionForm: React.FC<PostSubmissionFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tool: '',
    tip_category: '',
    tags: [] as string[],
    image_url: '',
  });
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    // Validate that at least one category is selected
    if (!formData.tool && !formData.tip_category) {
      setError('Please select at least one category (tool or tip)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await communityApi.createPost(formData);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        title: '',
        content: '',
        tool: '',
        tip_category: '',
        tags: [],
        image_url: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-secondary border border-foreground-dim/20 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl transform transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-foreground-dim/10">
          <h2 className="text-xl font-medium text-foreground">
            Share a Tool or Tip
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-foreground-dim hover:bg-foreground-dim/10 hover:text-foreground transition-colors"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground-dim mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2.5 bg-secondary border border-foreground-dim/20 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder-foreground-dim/50 text-sm transition-colors"
              placeholder="Enter a descriptive title for your post..."
              required
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-foreground-dim mb-2">
              Content <span className="text-red-400">*</span>
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={8}
              className="w-full px-3 py-2.5 bg-secondary border border-foreground-dim/20 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder-foreground-dim/50 resize-none text-sm transition-colors"
              placeholder="Describe your tool or tip in detail. Include:

• What it does and how it helps
• Key features or benefits
• How to use it
• Any tips or best practices

Markdown formatting is supported!"
              required
            />
            <p className="text-xs text-foreground-dim mt-1">
              Supports Markdown formatting (links, bold, lists, etc.)
            </p>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tool Selection */}
            <div>
              <label htmlFor="tool" className="block text-sm font-medium text-foreground-dim mb-2">
                Tool (Optional)
              </label>
              <select
                id="tool"
                value={formData.tool}
                onChange={(e) => setFormData(prev => ({ ...prev, tool: e.target.value }))}
                className="w-full px-3 py-2.5 bg-secondary border border-foreground-dim/20 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder-foreground-dim/50 text-sm transition-colors"
              >
                <option value="">Select a tool (optional)</option>
                {TOOL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select if this post is about a specific tool
              </p>
            </div>

            {/* Tip Category Selection */}
            <div>
              <label htmlFor="tip_category" className="block text-sm font-medium text-foreground-dim mb-2">
                Tip Category (Optional)
              </label>
              <select
                id="tip_category"
                value={formData.tip_category}
                onChange={(e) => setFormData(prev => ({ ...prev, tip_category: e.target.value }))}
                className="w-full px-3 py-2.5 bg-secondary border border-foreground-dim/20 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder-foreground-dim/50 text-sm transition-colors"
              >
                <option value="">Select a tip category (optional)</option>
                {TIP_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select if this post contains tips or best practices
              </p>
            </div>
          </div>

          {/* Category Requirement Note */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-sm text-primary">
              <strong>Note:</strong> Please select at least one category (tool or tip) to help others discover your post.
            </p>
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-foreground-dim mb-2">
              Image URL (Optional)
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                className="flex-1 px-3 py-2.5 bg-secondary border border-foreground-dim/20 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder-foreground-dim/50 text-sm transition-colors"
                placeholder="https://example.com/image.jpg"
              />
              <button
                type="button"
                className="px-3 py-2.5 bg-secondary border border-foreground-dim/20 rounded-lg hover:bg-foreground-dim/10 transition-colors text-foreground-dim hover:text-foreground"
                title="Upload image"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground-dim mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-foreground-dim/5 border border-foreground-dim/20 text-foreground rounded-full text-xs font-medium"
                >
                  <Tag className="w-3 h-3 mr-1.5 text-foreground-dim" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1.5 text-foreground-dim hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2.5 bg-secondary border border-foreground-dim/20 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground placeholder-foreground-dim/50 text-sm transition-colors"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2.5 bg-primary/90 hover:bg-primary text-secondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newTag.trim()}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-foreground-dim mt-1">
              Add relevant tags to help others discover your post
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-foreground-dim/10">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.content.trim()}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish Post</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};