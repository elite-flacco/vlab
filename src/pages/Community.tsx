import React, { useState, useEffect } from 'react';
import { Search, Plus, MessageSquare, AlertCircle, Tag as TagIcon, X } from 'lucide-react';
import { PostSubmissionForm } from '../components/Community/PostSubmissionForm';
import { PostCard } from '../components/Community/PostCard';
import { PostDetailView } from '../components/Community/PostDetailView';
import { communityApi } from '../lib/communityApi';

// Tool and category options for filtering
const TOOL_OPTIONS = [
  { value: 'bolt', label: 'Bolt' },
  { value: 'loveable', label: 'Loveable' },
  { value: 'replit', label: 'Replit' },
  { value: 'v0', label: 'V0' },
  { value: 'other', label: 'Other' },
];

const TIP_CATEGORY_OPTIONS = [
  { value: 'prompt_tricks', label: 'Prompt Tricks' },
  { value: 'integrations', label: 'Integrations' },
  { value: 'authentication', label: 'Authentication' },
  { value: 'payment', label: 'Payment' },
  { value: 'other', label: 'Other' },
];

export const Community: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Enhanced filters with URL state management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [selectedTipCategory, setSelectedTipCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending'>('trending');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);

  // Initialize filters from URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const toolParam = urlParams.get('tool');
    const tipCategoryParam = urlParams.get('tip_category');
    const searchParam = urlParams.get('search');
    const sortParam = urlParams.get('sort');

    if (toolParam) setSelectedTool(toolParam);
    if (tipCategoryParam) setSelectedTipCategory(tipCategoryParam);
    if (searchParam) setSearchTerm(searchParam);
    if (sortParam && ['newest', 'popular', 'trending'].includes(sortParam)) {
      setSortBy(sortParam as 'newest' | 'popular' | 'trending');
    }
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTool) params.set('tool', selectedTool);
    if (selectedTipCategory) params.set('tip_category', selectedTipCategory);
    if (searchTerm) params.set('search', searchTerm);
    if (sortBy !== 'trending') params.set('sort', sortBy);

    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [selectedTool, selectedTipCategory, searchTerm, sortBy]);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, selectedTool, selectedTipCategory, sortBy, selectedTag]);

  useEffect(() => {
    // Reset to first page when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchPosts();
    }
  }, [searchTerm, selectedTool, selectedTipCategory, sortBy, selectedTag]);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await communityApi.listPosts({
        page: currentPage,
        limit: 10,
        tool: selectedTool || undefined,
        tip_category: selectedTipCategory || undefined,
        sort: sortBy,
        search: searchTerm || undefined,
        tag: selectedTag || undefined,
      });

      setPosts(response.data);
      setHasNextPage(response.pagination.hasNextPage);
      setTotalPosts(response.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPosts();
  };

  const handlePostSuccess = () => {
    setCurrentPage(1);
    fetchPosts();
  };

  const handlePostClick = (postId: string) => {
    setSelectedPostId(postId);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Main Header with Share Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10">
        <div>
          <h1 className="mb-3">Community Hub</h1>
          <p>
            Connect, share, and learn with fellow vibe coders
          </p>
        </div>
        <button
          onClick={() => setShowSubmissionForm(true)}
          className="btn-primary mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Share Tool/Tip
        </button>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="terminal-window p-6 space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-dim" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search tools and tips..."
                className="search-input"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground-dim">Filter by:</span>
              <div className="flex flex-wrap items-center gap-3">
                {/* Tool Filter */}
                <select
                  value={selectedTool}
                  onChange={(e) => setSelectedTool(e.target.value)}
                  className="form-select"
                >
                  <option value="">All Tools</option>
                  {TOOL_OPTIONS.map((tool) => (
                    <option key={tool.value} value={tool.value}>
                      {tool.label}
                    </option>
                  ))}
                </select>

                {/* Tip Category Filter */}
                <select
                  value={selectedTipCategory}
                  onChange={(e) => setSelectedTipCategory(e.target.value)}
                  className="form-select"
                >
                  <option value="">All Tip Categories</option>
                  {TIP_CATEGORY_OPTIONS.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>

                {/* Active Tag Filter */}
                {selectedTag && (
                  <div className="flex items-center space-x-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-md text-xs font-medium">
                    <TagIcon className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate max-w-[120px]">{selectedTag}</span>
                    <button
                      onClick={() => setSelectedTag('')}
                      className="ml-0.5 text-primary/70 hover:text-primary transition-colors"
                      aria-label="Remove tag"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(selectedTool || selectedTipCategory || searchTerm) && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-xs text-foreground-dim">
                Showing {posts.length} of {totalPosts} posts
                {selectedTool && ` for ${TOOL_OPTIONS.find(t => t.value === selectedTool)?.label}`}
                {selectedTipCategory && ` in ${TIP_CATEGORY_OPTIONS.find(c => c.value === selectedTipCategory)?.label}`}
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
              <button
                onClick={() => {
                  setSelectedTool('');
                  setSelectedTipCategory('');
                  setSearchTerm('');
                  setSelectedTag('');
                }}
                className="text-xs text-foreground-dim hover:text-foreground-dim/70 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Posts List */}
      <div className="space-y-6 mt-6">
        {loading ? (
          <div className="text-center py-16">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-foreground-dim">Loading posts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex flex-col items-center">
                <AlertCircle className="w-6 h-6 text-red-600 mb-3" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchPosts}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-foreground-dim/30 mx-auto mb-4" />
            <h3 className="mb-2">No posts found</h3>
            <p className="mb-4">
              {searchTerm || selectedTool || selectedTipCategory || selectedTag
                ? 'Try adjusting your filters or search terms.'
                : 'Be the first to share a tool or tip with the community!'}
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostClick={handlePostClick}
              />
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-6">
              <div className="text-sm text-foreground-dim">
                Showing {posts.length} of {totalPosts} posts
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn-outline"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-foreground-dim flex items-center text-sm">
                  Page {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!hasNextPage}
                  className="btn-outline"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <PostSubmissionForm
        isOpen={showSubmissionForm}
        onClose={() => setShowSubmissionForm(false)}
        onSuccess={handlePostSuccess}
      />

      {selectedPostId && (
        <PostDetailView
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </div>
  );
};