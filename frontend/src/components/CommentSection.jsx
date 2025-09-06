import React, { useState, memo, useMemo } from 'react';
import { MessageCircle, Send, Reply, User, MoreHorizontal } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { decodeHtmlEntities } from '../utils/textUtils';
import LikeButton from './LikeButton';

// Stable formatter declared outside component to avoid re-creation on re-renders
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Extracted memoized comment item to prevent remounting on every keystroke
const CommentItem = memo(({ comment, isReply = false, onReply }) => (
  <div className={`${isReply ? 'ml-12 mt-4' : 'mb-6'} group`}>
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
        <User size={16} className="text-purple-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 text-sm">
              {comment.author?.username || 'Anonymous'}
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {formatDate(comment.createdAt)}
              </span>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal size={14} className="text-gray-400" />
              </button>
            </div>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {decodeHtmlEntities(comment.content)}
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-2">
          <LikeButton
            contentType="Comment"
            contentId={comment._id}
            initialLikeCount={comment.likes || 0}
            size="sm"
            variant="minimal"
            showCount={true}
          />
          {!isReply && (
            <button
              onClick={() => onReply(comment)}
              className="text-gray-500 hover:text-purple-600 text-sm transition-colors"
            >
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
    
    {/* Render replies */}
    {comment.replies && comment.replies.length > 0 && (
      <div className="mt-4">
        {comment.replies.map((reply) => (
          <CommentItem key={reply._id} comment={reply} isReply={true} onReply={onReply} />
        ))}
      </div>
    )}
  </div>
));

const CommentSection = ({ reviewId, initialComments = [], onAddComment, isLoading = false, onCommentAdded }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showComments, setShowComments] = useState(true);

  // Memoize nested comment tree to avoid recomputation on unrelated re-renders
  const nestedComments = useMemo(() => {
    const comments = Array.isArray(initialComments) ? initialComments : [];
    if (comments.length === 0) return [];

    // If already nested, prefer top-level items
    const hasRepliesArray = comments.some(c => Array.isArray(c.replies));
    if (hasRepliesArray) {
      return comments.filter(c => !c.parentComment);
    }

    const idToNode = new Map();
    comments.forEach((c) => {
      idToNode.set(c._id, { ...c, replies: [] });
    });

    const topLevel = [];
    comments.forEach((c) => {
      const node = idToNode.get(c._id);
      const parentRef = c.parentComment;
      if (parentRef) {
        const parentId = typeof parentRef === 'string' ? parentRef : parentRef?._id || String(parentRef);
        const parent = idToNode.get(parentId);
        if (parent) {
          parent.replies.push(node);
        } else {
          topLevel.push(node);
        }
      } else {
        topLevel.push(node);
      }
    });

    return topLevel;
  }, [initialComments]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddComment({
        content: newComment,
        parentId: replyTo?._id || null,
        reviewId
      });
      
      setNewComment('');
      setReplyTo(null);
      
      // Trigger refetch of comments after successful submission
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (comment) => {
    setReplyTo(comment);
    setShowComments(true);
  };

  const handleReplyClick = (comment) => handleReply(comment);

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <MessageCircle size={20} />
          <span>Comments ({nestedComments.length})</span>
        </h3>
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
        >
          {showComments ? 'Hide Comments' : 'Show Comments'}
        </button>
      </div>

      {/* Add Comment Form */}
      {userInfo && (
        <form onSubmit={handleSubmitComment} className="mb-6">
          {replyTo && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <p className="text-sm text-blue-800">
                Replying to <span className="font-medium">{replyTo.author?.username}</span>
              </p>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Cancel Reply
              </button>
            </div>
          )}
          
          <div className="flex space-x-3">
            <div className="w-10 h-10 bg-purple-main rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium">
                {userInfo.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyTo ? `Reply to ${replyTo.author?.username}...` : "Share your thoughts..."}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {newComment.length}/500 characters
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="flex items-center space-x-2 bg-purple-main hover:bg-purple-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Post Comment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      {showComments && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-main mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading comments...</p>
            </div>
          ) : initialComments.length > 0 ? (
            nestedComments.map((comment) => (
              <CommentItem key={comment._id} comment={comment} onReply={handleReplyClick} />
            ))
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="text-gray-400 mx-auto mb-3" size={48} />
              <p className="text-gray-500 mb-2">No comments yet</p>
              <p className="text-sm text-gray-400">
                {userInfo ? 'Be the first to share your thoughts!' : 'Login to join the conversation'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Login prompt for non-authenticated users */}
      {!userInfo && (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-3">Want to join the conversation?</p>
          <Link
            to="/login"
            className="bg-purple-main hover:bg-purple-dark text-white px-6 py-2 rounded-lg transition-colors inline-block"
          >
            Login to Comment
          </Link>
        </div>
      )}
    </div>
  );
};

export default CommentSection; 