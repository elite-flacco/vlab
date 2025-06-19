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
    category: 'tool' as 'tool' | 'tip',
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

    // Validate required fields based on category
    if (formData.category === 'tool' && !formData.tool) {
      setError('Please select a tool');
      return;
    }

    if (formData.category === 'tip' && !formData.tip_category) {
      setError('Please select a tip category');
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
        category: 'tool',
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

  const handleCategoryChange = (category: 'tool' | 'tip') => {
    setFormData(prev => ({
      ...prev,
      category,
      // Reset the other category field when switching
      tool: category === 'tool' ? prev.tool : '',
      tip_category: category === 'tip' ? prev.tip_category : '',
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Share a Tool or Tip</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What are you sharing?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleCategoryChange('tool')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.category === 'tool'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold mb-1">🛠️ Tool</h3>
                <p className="text-sm text-gray-600">
                  Share an AI tool, software, or service
                </p>
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('tip')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.category === 'tip'
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold mb-1">💡 Tip</h3>
                <p className="text-sm text-gray-600">
                  Share a helpful tip or best practice
                </p>
              </button>
            </div>
          </div>

          {/* Tool Selection (only for tools) */}
          {formData.category === 'tool' && (
            <div>
              <label htmlFor="tool" className="block text-sm font-medium text-gray-700 mb-2">
                Select Tool *
              </label>
              <select
                id="tool"
                value={formData.tool}
                onChange={(e) => setFormData(prev => ({ ...prev, tool: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                aria-label="Select the relevant tool"
              >
                <option value="">Choose the relevant tool</option>
                {TOOL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the tool this post is about
              </p>
            </div>
          )}

          {/* Tip Category Selection (only for tips) */}
          {formData.category === 'tip' && (
            <div>
              <label htmlFor="tip_category" className="block text-sm font-medium text-gray-700 mb-2">
                Select Category *
              </label>
              <select
                id="tip_category"
                value={formData.tip_category}
                onChange={(e) => setFormData(prev => ({ ...prev, tip_category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
                aria-label="Choose the tip category"
              >
                <option value="">Choose the tip category</option>
                {TIP_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the category that best describes your tip
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Enter a descriptive title for your ${formData.category}...`}
              required
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder={`Describe your ${formData.category} in detail. Include:\n\n• What it does and how it helps\n• Key features or benefits\n• How to use it\n• Any tips or best practices\n\nMarkdown formatting is supported!`}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports Markdown formatting (links, bold, lists, etc.)
            </p>
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
              Image URL (Optional)
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
              <button
                type="button"
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Upload image"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Add relevant tags to help others discover your {formData.category}
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.content.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish {formData.category === 'tool' ? 'Tool' : 'Tip'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};