import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Bookmark, Star } from 'lucide-react';
import { communityApi } from '../../lib/communityApi';
import { PostCard } from '../Community/PostCard';
import { useAuthStore } from '../../stores/authStore';

interface UserProfileSectionProps {
  onPostClick?: (postId: string) => void;
}

export const UserProfileSection: React.FC<UserProfileSectionProps> = ({ onPostClick }) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, activeTab]);

  const fetchUserData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'posts') {
        const posts = await communityApi.getUserPosts(user.id);
        setUserPosts(posts);
      } else if (activeTab === 'saved') {
        const saved = await communityApi.getSavedPosts();
        setSavedPosts(saved);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalPosts: userPosts.length,
    totalUpvotes: userPosts.reduce((sum, post) => sum + post.upvotes, 0),
    totalViews: userPosts.reduce((sum, post) => sum + post.view_count, 0),
  };

  // Store the scroll position when tab changes
  useEffect(() => {
    // Save the current scroll position
    const scrollY = window.scrollY;
    
    // After the component updates, restore the scroll position
    const timer = setTimeout(() => {
      window.scrollTo(0, scrollY);
    }, 0);
    
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleTabClick = (tab: 'posts' | 'saved', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveTab(tab);
  };

  return (
    <div className="space-y-4">

      {/* Compact Profile Stats */}
      <div className="card bg-secondary/80 p-3 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-background border border-primary/50 rounded-full flex-shrink-0 flex items-center justify-center">
              <User className="w-5 h-5 text-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-foreground truncate">
                {user?.name || 'User Profile'}
              </h1>
              <div className="flex items-center space-x-2 text-xs text-foreground-dim">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>Joined {new Date(user?.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          {/* Inline Stats */}
          <div className="flex items-center divide-x divide-foreground-dim/20 text-xs">
            <div className="px-2 text-center">
              <div className="font-semibold text-foreground">{stats.totalPosts}</div>
              <div className="text-foreground-dim">Posts</div>
            </div>
            <div className="px-2 text-center">
              <div className="font-semibold text-foreground">{stats.totalUpvotes}</div>
              <div className="text-foreground-dim">Upvotes</div>
            </div>
            <div className="px-2 text-center">
              <div className="font-semibold text-foreground">{stats.totalViews}</div>
              <div className="text-foreground-dim">Views</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card bg-secondary/80 overflow-hidden">
        <div className="border-b border-foreground-dim/10">
          <nav className="flex text-sm">
            <button
              type="button"
              onClick={(e) => handleTabClick('posts', e)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center space-x-2 focus:outline-none ${
                activeTab === 'posts'
                  ? 'text-primary border-b-2 border-primary bg-transparent'
                  : 'text-foreground-dim hover:text-foreground hover:bg-background/20'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>My Posts</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleTabClick('saved', e)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center space-x-2 focus:outline-none ${
                activeTab === 'saved'
                  ? 'text-primary border-b-2 border-primary bg-transparent'
                  : 'text-foreground-dim hover:text-foreground hover:bg-background/20'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved</span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-foreground-dim">Loading...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'posts' && (
                <>
                  {userPosts.length > 0 ? (
                    userPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onPostClick={onPostClick}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-foreground-dim/30 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
                      <p className="text-foreground-dim">
                        You haven't shared any tools or tips yet.
                      </p>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'saved' && (
                <>
                  {savedPosts.length > 0 ? (
                    savedPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onPostClick={onPostClick}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Bookmark className="w-12 h-12 text-foreground-dim/30 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No saved posts</h3>
                      <p className="text-foreground-dim">
                        Posts you save will appear here for easy access later.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Import User icon
import { User } from 'lucide-react';