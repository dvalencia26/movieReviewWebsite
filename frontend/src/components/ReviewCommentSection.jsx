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
    refetchOnMountOrArgChange: true
  });

  const handleCommentAdded = useCallback(async () => {
    // Wait a moment then refetch to ensure server has processed
    await new Promise(resolve => setTimeout(resolve, 100));
    refetch();
  }, [refetch]);

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

