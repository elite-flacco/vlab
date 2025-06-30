import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Loader2,
  User
} from 'lucide-react';
import { communityApi } from '../../lib/communityApi';

interface Comment {
  id: string;
  content: string;
  author: {
    name?: string;
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
  tool?: string;
  tip_category?: string;
  author: {
    name?: string;
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

  const getCategoryBadge = (tool?: string, tipCategory?: string) => {
    const badges = [];
    
    // Tool badge
    if (tool) {
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
    
    // Tip category badge
    if (tipCategory) {
      const categoryLabels: Record<string, string> = {
        'prompt_tricks': 'Prompt Tricks',
        'integrations': 'Integrations',
        'authentication': 'Authentication',
        'payment': 'Payment',
        'documentation': 'Documentation',
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

  // Function to parse text and convert URLs to links
  const parseTextWithLinks = (text: string) => {
    // This regex matches URLs starting with http://, https://, or www.
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    
    // Find all matches and their positions
    const matches: {text: string, index: number}[] = [];
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      matches.push({
        text: match[0],
        index: match.index
      });
    }
    
    // If no URLs found, return the text as is
    if (matches.length === 0) return text;
    
    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Rebuild the content with links
    matches.forEach((match, i) => {
      // Add text before the URL
      if (match.index > lastIndex) {
        result.push(text.substring(lastIndex, match.index));
      }
      
      // Add the URL as a link
      const url = match.text.startsWith('www.') ? `https://${match.text}` : match.text;
      result.push(
        <a 
          key={`link-${i}`} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary/60 hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {match.text}
        </a>
      );
      
      lastIndex = match.index + match.text.length;
    });
    
    // Add any remaining text after the last URL
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex));
    }
    
    return result;
  };

  const renderMarkdown = (content: string) => {
    if (!content) return null;
    
    return content.split('\n').map((line, index) => {
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-lg font-semibold mt-4 mb-2">{parseTextWithLinks(line.slice(3))}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-md font-medium mt-3 mb-1.5">{parseTextWithLinks(line.slice(4))}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="text-foreground-dim mb-1 ml-4">{parseTextWithLinks(line.slice(2))}</li>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-semibold text-foreground my-1.5">{parseTextWithLinks(line.slice(2, -2))}</p>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="text-foreground-dim mb-2 text-sm leading-relaxed">{parseTextWithLinks(line)}</p>;
    });
  };

  const renderComment = (comment: Comment, depth = 0) => {
    const isReplying = replyingTo === comment.id;
    
    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l-2 border-foreground/5 pl-4' : ''}`}>
        <div className="bg-foreground/5 rounded-xl p-4 mb-4 border border-foreground/10 transition-all hover:bg-foreground/10">
          {/* Comment Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2.5 text-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary">
                <User size={16} />
              </div>
              <div>
                <span className="font-medium text-foreground">{comment.author?.name || 'Unknown User'}</span>
                <div className="flex items-center space-x-2 text-xs text-foreground/50">
                  <span>{format(new Date(comment.created_at), 'MMM d, h:mm a')}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setReplyingTo(isReplying ? null : comment.id)}
              className="flex items-center text-foreground/60 hover:text-primary text-sm transition-colors duration-200 group"
            >
              <MessageSquare size={14} className="mr-1.5 group-hover:scale-110 transition-transform" />
              <span>Reply</span>
            </button>
          </div>

          {/* Comment Content */}
          <div className="text-foreground/90 mb-4 text-sm leading-relaxed">
            {renderMarkdown(comment.content)}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 text-sm">
            <button className="flex items-center space-x-1.5 text-foreground/60 hover:text-primary transition-colors duration-200 group">
              <ThumbsUp size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">{comment.upvotes}</span>
            </button>
            <button className="flex items-center space-x-1.5 text-foreground/60 hover:text-rose-500 transition-colors duration-200 group">
              <ThumbsDown size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">{comment.downvotes}</span>
            </button>
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-4 pl-2 border-l-2 border-foreground/5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
                  <User size={14} />
                </div>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="form-textarea bg-background/50"
                  />
                  <div className="flex justify-end mt-2 space-x-2">
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmitComment(replyContent, comment.id)}
                      disabled={!replyContent.trim() || submittingComment}
                      className="btn-primary"
                    >
                      {submittingComment ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        'Reply'
                      )}
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
                <span>Posted by {post.author?.name || 'Unknown User'}</span>
                <span className="mx-2 opacity-40">•</span>
                <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                <span className="mx-2 opacity-40">•</span>
                <span>{post.view_count} views</span>
              </div>
              
              <h1 className="text-2xl font-bold text-foreground mb-4">{post.title}</h1>
              
              <div className="prose prose-invert max-w-none mb-6 text-foreground/90">
                {renderMarkdown(post.content)}
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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  Comments • {post.comments?.length || 0}
                </h3>
              </div>

              {/* Add Comment Form */}
              <div className="mb-8 bg-foreground/5 p-4 rounded-xl border border-foreground/10">
                <div className="flex space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
                    <User size={18} />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="form-textarea bg-background/50"
                      rows={3}
                    />
                    <div className="flex justify-end mt-3 space-x-2">
                      {newComment.trim() && (
                        <button
                          onClick={() => setNewComment('')}
                          disabled={submittingComment}
                          className="btn-outline"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => handleSubmitComment(newComment)}
                        disabled={!newComment.trim() || submittingComment}
                        className="btn-primary"
                      >
                        {submittingComment ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          'Post Comment'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map(comment => renderComment(comment))
                ) : (
                  <div className="text-center py-10 bg-foreground/5 rounded-xl border border-dashed border-foreground/10">
                    <MessageSquare className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-foreground mb-2">No comments yet</h4>
                    <p className="text-foreground/50 max-w-md mx-auto">Be the first to share your thoughts on this post!</p>
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