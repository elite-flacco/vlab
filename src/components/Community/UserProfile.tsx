import React, { useState, useEffect } from 'react';
import { User, Calendar, TrendingUp, Bookmark, Settings } from 'lucide-react';
import { communityApi } from '../../lib/communityApi';
import { PostCard } from './PostCard';
import { useAuthStore } from '../../stores/authStore';

interface UserProfileProps {
  userId?: string;
  onPostClick?: (postId: string) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onPostClick }) => {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchUserData();
    }
  }, [targetUserId, activeTab]);

  const fetchUserData = async () => {
    if (!targetUserId) return;

    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'posts') {
        const posts = await communityApi.getUserPosts(targetUserId);
        setUserPosts(posts);
      } else if (activeTab === 'saved' && isOwnProfile) {
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="card bg-secondary/80 p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-background border border-primary/50 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {isOwnProfile ? currentUser?.name : 'User Profile'}
            </h1>
            <p className="text-foreground-dim">Community Member</p>
            <div className="flex items-center space-x-1 text-sm text-foreground-dim mt-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date().toLocaleDateString()}</span>
            </div>
          </div>
          {isOwnProfile && (
            <button className="p-2 text-foreground-dim hover:text-foreground transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-foreground-dim/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalPosts}</div>
            <div className="text-sm text-foreground-dim">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalUpvotes}</div>
            <div className="text-sm text-foreground-dim">Upvotes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalViews}</div>
            <div className="text-sm text-foreground-dim">Views</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card bg-secondary/80 overflow-hidden">
        <div className="border-b border-foreground-dim/10">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'text-primary border-b-2 border-primary bg-primary/10'
                  : 'text-foreground-dim hover:text-foreground'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Posts</span>
              </div>
            </button>
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'saved'
                    ? 'text-primary border-b-2 border-primary bg-primary/10'
                    : 'text-foreground-dim hover:text-foreground'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Bookmark className="w-4 h-4" />
                  <span>Saved</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="p-0 mt-4">
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
                        {isOwnProfile
                          ? "You haven't shared any tools or tips yet."
                          : "This user hasn't shared any tools or tips yet."
                        }
                      </p>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'saved' && isOwnProfile && (
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