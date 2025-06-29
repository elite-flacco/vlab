import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  Eye,
  Tag,
  ExternalLink,
  User,
  Clock
} from 'lucide-react';
import { communityApi } from '../../lib/communityApi';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    tool?: string;
    tip_category?: string;
    author: {
      name: string;
      avatar_url?: string;
    };
    upvotes: number;
    downvotes: number;
    comment_count: number;
    view_count: number;
    tags?: Array<{ tag: string }>;
    user_vote?: Array<{ vote_type: string }>;
    user_saved?: Array<{ id: string }>;
    image_url?: string;
    created_at: string;
  };
  onPostClick?: (postId: string) => void;
  showFullContent?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPostClick,
  showFullContent = false
}) => {
  const [userVote, setUserVote] = useState<string | null>(
    post.user_vote?.[0]?.vote_type || null
  );
  const [isSaved, setIsSaved] = useState(!!post.user_saved?.length);
  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [downvotes, setDownvotes] = useState(post.downvotes);
  const [loading, setLoading] = useState(false);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (loading) return;

    setLoading(true);
    try {
      if (userVote === voteType) {
        // Remove vote
        await communityApi.removeVote(post.id);
        setUserVote(null);
        if (voteType === 'upvote') {
          setUpvotes(prev => prev - 1);
        } else {
          setDownvotes(prev => prev - 1);
        }
      } else {
        // Add or change vote
        await communityApi.votePost(post.id, { vote_type: voteType });

        // Update counts
        if (userVote === 'upvote' && voteType === 'downvote') {
          setUpvotes(prev => prev - 1);
          setDownvotes(prev => prev + 1);
        } else if (userVote === 'downvote' && voteType === 'upvote') {
          setDownvotes(prev => prev - 1);
          setUpvotes(prev => prev + 1);
        } else if (voteType === 'upvote') {
          setUpvotes(prev => prev + 1);
        } else {
          setDownvotes(prev => prev + 1);
        }

        setUserVote(voteType);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (loading) return;

    setLoading(true);
    try {
      if (isSaved) {
        await communityApi.unsavePost(post.id);
        setIsSaved(false);
      } else {
        await communityApi.savePost(post.id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content: string) => {
    if (!showFullContent && content.length > 200) {
      return content.substring(0, 200) + '...';
    }
    return content;
  };

  const getCategoryBadges = () => {
    const badges = [];

    // Tool badge
    if (post.tool) {
      const toolLabels: Record<string, string> = {
        'bolt': 'Bolt',
        'loveable': 'Loveable',
        'replit': 'Replit',
        'v0': 'V0',
        'other': 'Other'
      };

      const toolColors: Record<string, { bg: string; text: string; border: string }> = {
        'bolt': { bg: 'bg-blue-900/30', text: 'text-blue-300', border: 'border-blue-700/50' },
        'loveable': { bg: 'bg-pink-900/30', text: 'text-pink-300', border: 'border-pink-700/50' },
        'replit': { bg: 'bg-orange-900/30', text: 'text-orange-300', border: 'border-orange-700/50' },
        'v0': { bg: 'bg-purple-900/30', text: 'text-purple-300', border: 'border-purple-700/50' },
        'other': { bg: 'bg-gray-700/30', text: 'text-gray-300', border: 'border-gray-600/50' }
      };
      
      const colors = toolColors[post.tool] || toolColors['other'];
      
      badges.push(
        <span key="tool" className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
          🛠️ {toolLabels[post.tool] || post.tool}
        </span>
      );
    }

    // Tip category badge
    if (post.tip_category) {
      const categoryLabels: Record<string, string> = {
        'prompt_tricks': 'Prompt Tricks',
        'integrations': 'Integrations',
        'authentication': 'Authentication',
        'payment': 'Payment',
        'other': 'Other'
      };
      
      const tipColors: Record<string, { bg: string; text: string; border: string }> = {
        'prompt_tricks': { bg: 'bg-purple-900/30', text: 'text-purple-300', border: 'border-purple-700/50' },
        'integrations': { bg: 'bg-indigo-900/30', text: 'text-indigo-300', border: 'border-indigo-700/50' },
        'authentication': { bg: 'bg-cyan-900/30', text: 'text-cyan-300', border: 'border-cyan-700/50' },
        'payment': { bg: 'bg-emerald-900/30', text: 'text-emerald-300', border: 'border-emerald-700/50' },
        'other': { bg: 'bg-slate-900/30', text: 'text-slate-300', border: 'border-slate-700/50' }
      };
      
      const colors = tipColors[post.tip_category] || tipColors['other'];
      
      badges.push(
        <span key="tip" className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
          💡 {categoryLabels[post.tip_category] || post.tip_category}
        </span>
      );
    }

    return badges;
  };

  return (
    <div className="card bg-secondary/80">
      {/* Title */}
      <div className="flex items-start justify-between mb-4">
        <h3
          className="mb-3 cursor-pointer hover:text-green-600 transition-colors"
          onClick={() => onPostClick?.(post.id)}
        >
          {post.title}
        </h3>
        <button
          onClick={handleSave}
          disabled={loading}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          {isSaved ? (
            <BookmarkCheck className="w-4 h-4 text-primary" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="mb-4">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="text-foreground-dim text-sm leading-relaxed mb-4 whitespace-pre-wrap">
        {renderContent(post.content)}
        {!showFullContent && post.content.length > 200 && (
          <button
            onClick={() => onPostClick?.(post.id)}
            className="text-green-600 hover:text-green-800 ml-1"
          >
            Read more
          </button>
        )}
      </div>

      {/* Author and Date */}
      <div className="flex items-center space-x-4 mb-4 text-xs text-foreground-dim">
        <div className="flex items-center space-x-1">
          <User className="w-3 h-3" />
          <span>{post.author.name}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Eye className="w-3 h-3" />
          <span>{post.view_count} views</span>
        </div>
      </div>

      {/* Category Badges and Tags */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-wrap gap-2">
          {getCategoryBadges()}

          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              <Tag className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {post.tags.slice(0, 2).map(t => t.tag).join(', ')}
                {post.tags.length > 2 && ` +${post.tags.length - 2}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-foreground-dim/10">
        <div className="flex items-center space-x-2">
          {/* Upvote */}
          <button
            onClick={() => handleVote('upvote')}
            disabled={loading}
            className={`flex items-center space-x-1 p-1 rounded-full hover:bg-foreground/5 ${userVote === 'upvote' ? 'text-primary' : 'text-foreground/60 hover:text-primary'}`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm font-medium">{upvotes}</span>
          </button>

          {/* Downvote */}
          <button
            onClick={() => handleVote('downvote')}
            disabled={loading}
            className={`flex items-center space-x-1 p-1 rounded-full hover:bg-foreground/5 ${userVote === 'downvote' ? 'text-destructive' : 'text-foreground/60 hover:text-destructive'}`}
          >
            <ThumbsDown className="w-4 h-4" />
            <span className="text-sm font-medium">{downvotes}</span>
          </button>

          {/* Comments */}
          <button
            onClick={() => onPostClick?.(post.id)}
            className="flex items-center space-x-1 px-1 py-1 rounded-full hover:bg-foreground/5 text-foreground-dim hover:text-foreground transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">{post.comment_count}</span>
          </button>
        </div>

        {/* View Post */}
        {!showFullContent && (
          <button
            onClick={() => onPostClick?.(post.id)}
            className="flex items-center space-x-1 text-foreground-dim hover:text-foreground transition-colors text-xs"
          >
            <span>View</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}