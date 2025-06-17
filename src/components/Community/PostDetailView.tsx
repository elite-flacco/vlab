import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  X, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Send, 
  Reply,
  User,
  Clock,
  Tag,
  Eye,
  Loader2
} from 'lucide-react';
import { communityApi } from '../../lib/communityApi';
import { PostCard } from './PostCard';

interface PostDetailViewProps {
  postId: string;
  onClose: () => void;
}

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

export const PostDetailView: React.FC<PostDetailViewProps> = ({ postId, onClose }) => {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await communityApi.getPost(postId);
      setPost(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load post');
    } finally {
      setLoading(false);
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
      
      // Refresh post to get updated comments
      await fetchPost();
      
      // Reset form
      if (parentId) {
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
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
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors text-sm"
            >
              <Reply className="w-3 h-3" />
              <span>Reply</span>
            </button>
          </div>

          {/* Comment Content */}
          <div className="text-gray-800 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
            {comment.content}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors">
              <ThumbsUp className="w-3 h-3" />
              <span className="text-xs">{comment.upvotes}</span>
            </button>
            <button className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors">
              <ThumbsDown className="w-3 h-3" />
              <span className="text-xs">{comment.downvotes}</span>
            </button>
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Reply to ${comment.author.name}...`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                  rows={3}
                />
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => handleSubmitComment(replyContent, comment.id)}
                    disabled={!replyContent.trim() || submittingComment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center space-x-1"
                  >
                    {submittingComment ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Render Replies */}
        {comment.replies && comment.replies.map(reply => renderComment(reply, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-700">Loading post...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error || 'Post not found'}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Post Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Post */}
            <PostCard post={post} showFullContent={true} />

            {/* Comments Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Comments ({post.comment_count})
              </h3>

              {/* Add Comment Form */}
              <div className="mb-6">
                <div className="flex space-x-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={() => handleSubmitComment(newComment)}
                    disabled={!newComment.trim() || submittingComment}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {submittingComment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Comment</span>
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map((comment: Comment) => renderComment(comment))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h4>
                    <p className="text-gray-500">Be the first to share your thoughts!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};