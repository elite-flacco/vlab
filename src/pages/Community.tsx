import React, { useState, useEffect } from 'react';
import { Search, Plus, TrendingUp, MessageSquare, Users, Award, Tag as TagIcon, Loader2, AlertCircle } from 'lucide-react';
import { PostSubmissionForm } from '../components/Community/PostSubmissionForm';
import { PostCard } from '../components/Community/PostCard';
import { PostDetailView } from '../components/Community/PostDetailView';
import { UserProfile } from '../components/Community/UserProfile';
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
  const [activeSection, setActiveSection] = useState<'tools-tips' | 'profile'>('tools-tips');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'tool' | 'tip' | ''>('');
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [selectedTipCategory, setSelectedTipCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending'>('trending');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, selectedCategory, selectedTool, selectedTipCategory, sortBy, selectedTag]);

  useEffect(() => {
    // Reset to first page when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchPosts();
    }
  }, [searchTerm, selectedCategory, selectedTool, selectedTipCategory, sortBy, selectedTag]);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await communityApi.listPosts({
        page: currentPage,
        limit: 10,
        category: selectedCategory || undefined,
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

  const handleCategoryChange = (category: 'tool' | 'tip' | '') => {
    setSelectedCategory(category);
    // Reset specific filters when changing category
    if (category !== 'tool') {
      setSelectedTool('');
    }
    if (category !== 'tip') {
      setSelectedTipCategory('');
    }
  };

  const renderToolsTipsSection = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tools & Tips</h2>
          <p className="text-gray-600 mt-1">Discover and share practical AI tools and usage tips</p>
        </div>
        <button
          onClick={() => setShowSubmissionForm(true)}
          className="btn-primary inline-flex items-center px-4 py-2.5 text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Share Tool/Tip
        </button>
      </div>

      {/* Search and Filters */}
      <div className="border border-border rounded-lg p-4 space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search tools and tips..."
              className="search-input"
            />
          </div>
          <button
            onClick={handleSearch}
            className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value as 'tool' | 'tip' | '')}
            className="form-input text-sm py-1.5"
          >
            <option value="">All Categories</option>
            <option value="tool">🛠️ Tools</option>
            <option value="tip">💡 Tips</option>
          </select>

          {/* Tool Filter (only show when category is 'tool' or 'all') */}
          {(selectedCategory === 'tool' || selectedCategory === '') && (
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="form-input text-sm py-1.5"
            >
              <option value="">All Tools</option>
              {TOOL_OPTIONS.map((tool) => (
                <option key={tool.value} value={tool.value}>
                  {tool.label}
                </option>
              ))}
            </select>
          )}

          {/* Tip Category Filter (only show when category is 'tip' or 'all') */}
          {(selectedCategory === 'tip' || selectedCategory === '') && (
            <select
              value={selectedTipCategory}
              onChange={(e) => setSelectedTipCategory(e.target.value)}
              className="form-input text-sm py-1.5"
            >
              <option value="">All Tip Categories</option>
              {TIP_CATEGORY_OPTIONS.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          )}
          
          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="form-input text-sm py-1.5"
          >
            <option value="trending">🔥 Trending</option>
            <option value="newest">🆕 Newest</option>
            <option value="popular">⭐ Most Popular</option>
          </select>

          {/* Active Tag Filter */}
          {selectedTag && (
            <div className="flex items-center space-x-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
              <TagIcon className="w-3 h-3" />
              <span>{selectedTag}</span>
              <button
                onClick={() => setSelectedTag('')}
                className="ml-0.5 text-primary/70 hover:text-primary transition-colors"
                aria-label="Remove tag"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading posts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="bg-background border border-border rounded-lg p-6 max-w-md mx-auto">
              <div className="flex flex-col items-center">
                <AlertCircle className="w-6 h-6 text-destructive mb-3" />
                <p className="text-destructive mb-4">{error}</p>
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
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory || selectedTool || selectedTipCategory || selectedTag
                ? 'Try adjusting your filters or search terms.'
                : 'Be the first to share a tool or tip with the community!'}
            </p>
            <button
              onClick={() => setShowSubmissionForm(true)}
              className="btn-primary inline-flex items-center px-4 py-2.5 text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Share Tool/Tip
            </button>
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
              <div className="text-sm text-gray-600">
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
                <span className="px-4 py-2 text-foreground-dim flex items-center">
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
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Main Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">AI Community Hub</h1>
        <p className="text-gray-600">
          Connect, share, and learn with fellow AI tool enthusiasts
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveSection('tools-tips')}
          className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md font-medium transition-colors ${
            activeSection === 'tools-tips'
              ? 'bg-white text-gray-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Tools & Tips
        </button>
        <button
          onClick={() => setActiveSection('profile')}
          className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md font-medium transition-colors text-sm ${
            activeSection === 'profile'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          My Profile
        </button>
      </div>

      {/* Section Content */}
      {activeSection === 'tools-tips' && renderToolsTipsSection()}
      {activeSection === 'profile' && (
        <UserProfile onPostClick={handlePostClick} />
      )}

      {/* Community Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stats Card Component */}
        {[
          { label: 'Total Posts', value: totalPosts, icon: TrendingUp, color: 'bg-blue-500' },
          { label: 'Active Members', value: '1,247', icon: Users, color: 'bg-green-500' },
          { label: 'Tools Shared', value: '856', icon: MessageSquare, color: 'bg-purple-500' },
          { label: 'Tips Shared', value: '391', icon: Award, color: 'bg-amber-500' }
        ].map((stat, index) => (
          <div key={index} className={`${stat.color} text-background p-5 rounded-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-background/90 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8 text-background/80" />
            </div>
          </div>
        ))}
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