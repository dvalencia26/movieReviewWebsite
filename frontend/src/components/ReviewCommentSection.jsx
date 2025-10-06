import React from 'react';
import { useGetReviewCommentsQuery } from '../redux/api/movies';
import CommentSection from './CommentSection';

const ReviewCommentSection = ({ reviewId, onAddComment }) => {
  const {
    data: commentsData,
    isLoading: commentsLoading,
    isFetching: commentsFetching
  } = useGetReviewCommentsQuery({
    reviewId,
    page: 1
  });

  // Cache invalidation handles refetching automatically
  const handleCommentAdded = () => {
    // Intentionally empty - invalidatesTags handles refetch
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

