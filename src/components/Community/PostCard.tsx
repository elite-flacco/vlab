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
    category: 'tool' | 'tip';
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

  const getCategoryColor = (category: string) => {
    return category === 'tool' 
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-green-100 text-green-800 border-green-200';
  };

  const getCategoryIcon = (category: string) => {
    return category === 'tool' ? '🛠️' : '💡';
  };

  const getToolLabel = (tool: string) => {
    const toolLabels: Record<string, string> = {
      'bolt': 'Bolt',
      'loveable': 'Loveable',
      'replit': 'Replit',
      'v0': 'V0',
      'other': 'Other'
    };
    return toolLabels[tool] || tool;
  };

  const getTipCategoryLabel = (tipCategory: string) => {
    const categoryLabels: Record<string, string> = {
      'prompt_tricks': 'Prompt Tricks',
      'integrations': 'Integrations',
      'authentication': 'Authentication',
      'payment': 'Payment',
      'other': 'Other'
    };
    return categoryLabels[tipCategory] || tipCategory;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(post.category)}`}>
            {getCategoryIcon(post.category)} {post.category}
          </span>
          
          {/* Tool/Category specific badge */}
          {post.category === 'tool' && post.tool && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 border border-purple-200 rounded-full text-xs font-medium">
              {getToolLabel(post.tool)}
            </span>
          )}
          
          {post.category === 'tip' && post.tip_category && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 border border-orange-200 rounded-full text-xs font-medium">
              {getTipCategoryLabel(post.tip_category)}
            </span>
          )}
          
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
        
        <button
          onClick={handleSave}
          disabled={loading}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          {isSaved ? (
            <BookmarkCheck className="w-4 h-4 text-blue-600" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Title */}
      <h3 
        className="text-lg font-semibold text-gray-900 mb-3 cursor-pointer hover:text-blue-600 transition-colors"
        onClick={() => onPostClick?.(post.id)}
      >
        {post.title}
      </h3>

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
      <div className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
        {renderContent(post.content)}
        {!showFullContent && post.content.length > 200 && (
          <button
            onClick={() => onPostClick?.(post.id)}
            className="text-blue-600 hover:text-blue-800 ml-1"
          >
            Read more
          </button>
        )}
      </div>

      {/* Author and Date */}
      <div className="flex items-center space-x-4 mb-4 text-xs text-gray-500">
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

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          {/* Upvote */}
          <button
            onClick={() => handleVote('upvote')}
            disabled={loading}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors disabled:opacity-50 ${
              userVote === 'upvote'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm font-medium">{upvotes}</span>
          </button>

          {/* Downvote */}
          <button
            onClick={() => handleVote('downvote')}
            disabled={loading}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors disabled:opacity-50 ${
              userVote === 'downvote'
                ? 'bg-red-100 text-red-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
            <span className="text-sm font-medium">{downvotes}</span>
          </button>

          {/* Comments */}
          <button
            onClick={() => onPostClick?.(post.id)}
            className="flex items-center space-x-1 px-3 py-1 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">{post.comment_count}</span>
          </button>
        </div>

        {/* View Post */}
        {!showFullContent && (
          <button
            onClick={() => onPostClick?.(post.id)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors text-sm"
          >
            <span>View</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};