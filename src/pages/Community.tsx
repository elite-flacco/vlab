import React, { useState, useEffect } from 'react';
import { Search, Plus, TrendingUp, MessageSquare, Users, Award, Filter, ChevronDown, Tag as TagIcon, Loader2 } from 'lucide-react';
import { PostSubmissionForm } from '../components/Community/PostSubmissionForm';
import { PostCard } from '../components/Community/PostCard';
import { PostDetailView } from '../components/Community/PostDetailView';
import { UserProfile } from '../components/Community/UserProfile';
import { communityApi } from '../lib/communityApi';

export const Community: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'tools-tips' | 'profile'>('tools-tips');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending'>('trending');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, selectedCategory, sortBy, selectedTag]);

  useEffect(() => {
    // Reset to first page when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchPosts();
    }
  }, [searchTerm, selectedCategory, sortBy, selectedTag]);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await communityApi.listPosts({
        page: currentPage,
        limit: 10,
        category: selectedCategory || undefined,
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

  const renderToolsTipsSection = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tools & Tips</h2>
          <p className="text-gray-600 mt-1">Discover and share practical AI tools and usage tips</p>
        </div>
        <button
          onClick={() => setShowSubmissionForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Share Tool/Tip
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        {/* Search Bar */}
        <div className="flex space-x-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search tools and tips..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="tool">🛠️ Tools</option>
            <option value="tip">💡 Tips</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="trending">🔥 Trending</option>
            <option value="newest">🆕 Newest</option>
            <option value="popular">⭐ Most Popular</option>
          </select>

          {selectedTag && (
            <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <TagIcon className="w-3 h-3" />
              <span>{selectedTag}</span>
              <button
                onClick={() => setSelectedTag('')}
                className="text-blue-600 hover:text-blue-800"
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
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading posts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchPosts}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory || selectedTag
                ? 'Try adjusting your filters or search terms.'
                : 'Be the first to share a tool or tip with the community!'}
            </p>
            <button
              onClick={() => setShowSubmissionForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!hasNextPage}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Community Hub</h1>
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
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Tools & Tips
        </button>
        <button
          onClick={() => setActiveSection('profile')}
          className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md font-medium transition-colors ${
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
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Posts</p>
              <p className="text-2xl font-bold">{totalPosts}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Active Members</p>
              <p className="text-2xl font-bold">1,247</p>
            </div>
            <Users className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Tools Shared</p>
              <p className="text-2xl font-bold">856</p>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Tips Shared</p>
              <p className="text-2xl font-bold">391</p>
            </div>
            <Award className="w-8 h-8 text-orange-200" />
          </div>
        </div>
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