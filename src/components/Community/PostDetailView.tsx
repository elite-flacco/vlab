import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Loader2,
  Clock,
  User
} from 'lucide-react';
import { communityApi } from '../../lib/communityApi';

interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    avatar_url?: string;
  };
  upvotes: number;
  downvotes: number;
  user_vote?: Array<{ vote_type: string }>;
  created_at: string;
  replies?: Comment[];
}

interface PostDetailViewProps {
  postId: string;
  onClose: () => void;
}

interface Post {
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
  comments: Comment[];
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({ postId, onClose }) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await communityApi.getPost(postId);
      const postData = response.data;
      setPost(postData);
      setIsSaved(!!postData.user_saved?.length);
      setUserVote(postData.user_vote?.[0]?.vote_type || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load post');
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!post) return;

    // Save current state for potential rollback
    const previousVote = userVote;
    const previousUpvotes = post.upvotes;
    const previousDownvotes = post.downvotes;

    // Optimistic UI update
    let newUpvotes = post.upvotes;
    let newDownvotes = post.downvotes;
    let newUserVote: 'upvote' | 'downvote' | null = voteType;

    if (previousVote === voteType) {
      // Remove vote
      newUserVote = null;
      if (voteType === 'upvote') newUpvotes--;
      else newDownvotes--;
    } else {
      // Change vote
      if (previousVote === 'upvote') newUpvotes--;
      else if (previousVote === 'downvote') newDownvotes--;
      
      if (voteType === 'upvote') newUpvotes++;
      else newDownvotes++;
    }

    // Update local state
    setPost({
      ...post,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      user_vote: newUserVote ? [{ vote_type: newUserVote }] : []
    });
    setUserVote(newUserVote);

    // Make API call
    try {
      if (previousVote === voteType) {
        await communityApi.removeVote(post.id);
      } else {
        await communityApi.votePost(post.id, { vote_type: voteType });
      }
    } catch (err) {
      console.error('Error voting:', err);
      // Revert on error
      setPost({
        ...post,
        upvotes: previousUpvotes,
        downvotes: previousDownvotes,
        user_vote: previousVote ? [{ vote_type: previousVote }] : []
      });
      setUserVote(previousVote);
      setError('Failed to update vote');
    }
  };

  const handleToggleSave = async () => {
    if (!post) return;

    try {
      const newSavedState = !isSaved;
      setIsSaved(newSavedState);
      
      if (newSavedState) {
        await communityApi.savePost(post.id);
      } else {
        await communityApi.unsavePost(post.id);
      }
    } catch (err) {
      console.error('Error saving post:', err);
      setIsSaved(!isSaved); // Revert on error
      setError('Failed to update save status');
    }
  };

  const handleSubmitComment = async (content: string, parentId?: string) => {
    if (!content.trim()) return;

    setSubmittingComment(true);
    try {
      await communityApi.addComment(postId, {
        content: content.trim(),
        parent_comment_id: parentId,
      });
      
      // Refresh comments
      await fetchPost();
      
      // Reset form
      if (parentId) {
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getCategoryBadge = (category: string, tool?: string, tipCategory?: string) => {
    const badges = [];
    
    // Main category badge
    if (category === 'tool') {
      badges.push(
        <span key="category" className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
          🛠️ Tool
        </span>
      );
    } else {
      badges.push(
        <span key="category" className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
          💡 Tip
        </span>
      );
    }
    
    // Subcategory badge
    if (category === 'tool' && tool) {
      const toolLabels: Record<string, string> = {
        'bolt': 'Bolt',
        'loveable': 'Loveable',
        'replit': 'Replit',
        'v0': 'V0',
        'other': 'Other'
      };
      badges.push(
        <span key="tool" className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 border border-purple-200 rounded-full text-xs font-medium">
          {toolLabels[tool] || tool}
        </span>
      );
    }
    
    if (category === 'tip' && tipCategory) {
      const categoryLabels: Record<string, string> = {
        'prompt_tricks': 'Prompt Tricks',
        'integrations': 'Integrations',
        'authentication': 'Authentication',
        'payment': 'Payment',
        'other': 'Other'
      };
      badges.push(
        <span key="tip-category" className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 border border-orange-200 rounded-full text-xs font-medium">
          {categoryLabels[tipCategory] || tipCategory}
        </span>
      );
    }
    
    return badges;
  };

  const renderComment = (comment: Comment, depth = 0) => {
    const isReplying = replyingTo === comment.id;
    
    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          {/* Comment Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span className="font-medium">{comment.author.name}</span>
              <span>•</span>
              <Clock className="w-3 h-3" />
              <span>{format(new Date(comment.created_at), 'MMM d, h:mm a')}</span>
            </div>
            
            <button
              onClick={() => setReplyingTo(isReplying ? null : comment.id)}
              className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
            >
              <MessageSquare size={14} className="mr-1" />
              <span>Reply</span>
            </button>
          </div>

          {/* Comment Content */}
          <div className="text-gray-800 mb-3">
            {comment.content}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <button className="flex items-center space-x-1 hover:text-blue-600">
              <ThumbsUp size={16} />
              <span>{comment.upvotes}</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-red-600">
              <ThumbsDown size={16} />
              <span>{comment.downvotes}</span>
            </button>
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 pl-2 border-l-2 border-gray-100">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[60px]"
                  />
                  <div className="flex justify-end mt-1">
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmitComment(replyContent, comment.id)}
                      disabled={!replyContent.trim() || submittingComment}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? 'Posting...' : 'Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Render Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-background border border-foreground/20 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center text-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
            <span>Loading post...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-background border border-foreground/20 rounded-lg p-6 max-w-md w-full">
          <div className="text-center text-foreground">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-foreground/80 mb-4">{error || 'Post not found'}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-foreground/20 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-foreground/20">
          <h2 className="text-xl font-semibold text-foreground">Post Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6">
            {/* Post Content */}
            <div className="mb-8">
              <div className="flex items-center text-sm text-foreground/60 mb-4">
                <span>Posted by {post.author.name}</span>
                <span className="mx-2 opacity-40">•</span>
                <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                <span className="mx-2 opacity-40">•</span>
                <span>{post.view_count} views</span>
              </div>
              
              <h1 className="text-2xl font-bold text-foreground mb-4">{post.title}</h1>
              
              <div className="prose prose-invert max-w-none mb-6 text-foreground/90">
                {post.content}
              </div>
              
              <div className="flex items-center pt-4 border-t border-foreground/10">
                <div className="flex items-center mr-6">
                  <button 
                    onClick={() => handleVote('upvote')}
                    className={`p-1 rounded-full hover:bg-foreground/5 ${userVote === 'upvote' ? 'text-primary' : 'text-foreground/60 hover:text-primary'}`}
                  >
                    <ThumbsUp size={18} />
                  </button>
                  <span className="mx-1 text-sm font-medium text-foreground/80">{post.upvotes}</span>
                  
                  <button 
                    onClick={() => handleVote('downvote')}
                    className={`p-1 rounded-full hover:bg-foreground/5 ${userVote === 'downvote' ? 'text-destructive' : 'text-foreground/60 hover:text-destructive'}`}
                  >
                    <ThumbsDown size={18} />
                  </button>
                  <span className="mx-1 text-sm font-medium text-foreground/80">{post.downvotes}</span>
                </div>
                
                <button 
                  onClick={handleToggleSave}
                  className={`flex items-center text-sm ${isSaved ? 'text-primary' : 'text-foreground/60 hover:text-primary'}`}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-1" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t border-foreground/10 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground/80">
                  Comments ({post.comments?.length || 0})
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-foreground/10 text-foreground/60">
                  Coming Soon
                </span>
              </div>

              {/* Add Comment Form - Disabled */}
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                  <p className="text-foreground/60">Commenting will be available soon</p>
                </div>
                <div className="flex space-x-3 opacity-50 pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-foreground/10 flex-shrink-0" />
                  <div className="flex-1">
                    <textarea
                      disabled
                      placeholder="Share your thoughts..."
                      className="w-full px-4 py-3 bg-background border border-foreground/20 rounded-lg resize-none text-foreground/50"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        disabled
                        className="px-3 py-1 text-sm text-foreground/30 mr-2"
                      >
                        Cancel
                      </button>
                      <button
                        disabled
                        className="px-4 py-1 bg-foreground/10 text-foreground/30 text-sm rounded-md cursor-not-allowed"
                      >
                        Post Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              {/* <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                    <p className="text-foreground/60 text-sm">Comments will be visible when the feature launches</p>
                  </div>
                  <div className="opacity-30">
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-foreground mb-2">No comments yet</h4>
                      <p className="text-foreground/50">Be the first to share your thoughts!</p>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};