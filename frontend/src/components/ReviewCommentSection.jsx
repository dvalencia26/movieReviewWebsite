import React from 'react';
import { useGetReviewCommentsQuery } from '../redux/api/movies';
import CommentSection from './CommentSection';

const ReviewCommentSection = ({ reviewId, onAddComment }) => {
  const {
    data: commentsData,
    isLoading: commentsLoading,
    isFetching: commentsFetching,
    refetch: refetchComments
  } = useGetReviewCommentsQuery({
    reviewId,
    page: 1
  });

  const handleCommentAdded = async () => {
    // Force a refetch so the new comment appears immediately
    try {
      await refetchComments();
    } catch (error) {
      console.error('Failed to refresh comments after add:', error);
    }
  };

  return (
    <CommentSection
      reviewId={reviewId}
      initialComments={commentsData?.comments || []}
      onAddComment={onAddComment}
      isLoading={commentsLoading || commentsFetching}
      onCommentAdded={handleCommentAdded}
    />
  );
};

export default React.memo(ReviewCommentSection);
