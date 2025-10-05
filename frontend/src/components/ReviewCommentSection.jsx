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
  }, {
    refetchOnMountOrArgChange: true
  });

  // No manual refetch needed - optimistic update handles UI, invalidatesTags handles sync
  const handleCommentAdded = () => {
    // Intentionally empty - optimistic update + cache invalidation handles everything
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

