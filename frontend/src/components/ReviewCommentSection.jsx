import React, { useCallback } from 'react';
import { useGetReviewCommentsQuery } from '../redux/api/movies';
import CommentSection from './CommentSection';

const ReviewCommentSection = ({ reviewId, onAddComment }) => {
  const {
    data: commentsData,
    isLoading: commentsLoading,
    refetch
  } = useGetReviewCommentsQuery({
    reviewId,
    page: 1
  }, {
    // Force refetch on mount to get fresh data
    refetchOnMountOrArgChange: true
  });

  const handleCommentAdded = useCallback(() => {
    console.log('Refetching comments for review:', reviewId); // Debug log
    refetch();
  }, [refetch, reviewId]);

  console.log('ReviewCommentSection render:', { // Debug log
    reviewId,
    commentsCount: commentsData?.comments?.length,
    isLoading: commentsLoading
  });

  return (
    <CommentSection
      reviewId={reviewId}
      initialComments={commentsData?.comments || []}
      onAddComment={onAddComment}
      isLoading={commentsLoading}
      onCommentAdded={handleCommentAdded}
    />
  );
};

export default React.memo(ReviewCommentSection);

