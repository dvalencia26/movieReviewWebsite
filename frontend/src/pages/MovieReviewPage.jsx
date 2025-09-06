import React, { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Users, Heart, Clock, MessageCircle, Eye, Film, Edit } from 'lucide-react';
import { useGetMovieDetailsQuery, useGetMovieReviewsQuery, useGetReviewCommentsQuery, useAddCommentMutation } from '../redux/api/movies';
import { useSelector } from 'react-redux';
import { useFavorites } from '../hooks/useFavorites';
import { toast } from 'sonner';
import Loader from '../components/Loader';
import CommentSection from '../components/CommentSection';
import LikeButton from '../components/LikeButton';
import { decodeHtmlEntities, formatTextContent } from '../utils/textUtils';

const MovieReviewPage = () => {
  const { id } = useParams(); // This will be the tmdbId
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const [currentPage, setCurrentPage] = useState(1);
  const [collapsedReviews, setCollapsedReviews] = useState(new Set());
  const [currentCommentCount, setCurrentCommentCount] = useState(0);

  // Favorites hook - Load data for this page
  const {
    isFavorite,
    isInWatchLater,
    toggleFavorite,
    toggleWatchLater,
    isActionLoading
  } = useFavorites({ autoLoad: true });

  // API mutations
  const [addComment, { isLoading: isAddingComment }] = useAddCommentMutation();
  // Review like handled via new Like model using LikeButton

  // Fetch movie details and reviews using Redux API
  const { data: movieData, isLoading: movieLoading, error: movieError, refetch: refetchMovieDetails } = useGetMovieDetailsQuery(id);
  const { data: reviewsData, isLoading: reviewsLoading, error: reviewsError, refetch: refetchReviews } = useGetMovieReviewsQuery({
    tmdbId: id,
    page: currentPage
  });

  // Handle comment submission
  const handleAddComment = async (commentData) => {
    try {
      await addComment({
        reviewId: commentData.reviewId,
        commentData: {
          content: commentData.content,
          parentId: commentData.parentId
        }
      }).unwrap();
      
      toast.success('Comment added successfully!');
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      throw error;
    }
  };

  // Handle review like toggle
  // Deprecated old review like handler removed; LikeButton now manages likes

  // Handle favorites toggle - Memoized to prevent re-renders
  const handleFavoriteToggle = useCallback(async () => {
    if (!userInfo) {
      toast.error('Please login to add to favorites');
      return;
    }
    await toggleFavorite(id);
  }, [userInfo, toggleFavorite, id]);

  // Handle watch later toggle - Memoized to prevent re-renders
  const handleWatchLaterToggle = useCallback(async () => {
    if (!userInfo) {
      toast.error('Please login to add to watch later');
      return;
    }
    await toggleWatchLater(id);
  }, [userInfo, toggleWatchLater, id]);

  // Toggle review collapse
  const toggleReviewCollapse = (reviewId) => {
    setCollapsedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  // Format review content to preserve line breaks and decode HTML entities - Memoized
  const formatReviewContent = useCallback((content) => {
    if (!content) return null;
    const paragraphs = formatTextContent(content);
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="mb-4 last:mb-0 leading-relaxed">
        {paragraph}
      </p>
    ));
  }, []);


  // Component to show real-time comment count
  const CommentCount = ({ commentCount }) => {
    return (
      <div className="flex items-center space-x-1">
        <MessageCircle size={16} />
        <span>{commentCount} comments</span>
      </div>
    );
  };

  // Enhanced comment section component with real API integration - Memoized
  const ReviewCommentSection = useCallback(({ reviewId, onCommentCountChange }) => {
    const { data: commentsData, isLoading: commentsLoading, refetch } = useGetReviewCommentsQuery({
      reviewId,
      page: 1
    }, {
      // Force refetch on mount to get fresh data
      refetchOnMountOrArgChange: true
    });

    // Notify parent of comment count changes
    React.useEffect(() => {
      if (commentsData?.comments && onCommentCountChange) {
        onCommentCountChange(commentsData.comments.length);
      }
    }, [commentsData?.comments, onCommentCountChange]);

    const handleCommentAdded = useCallback(() => {
      // Refetch comments and also invalidate related caches
      refetch();
    }, [refetch]);

    return (
      <CommentSection
        reviewId={reviewId}
        initialComments={commentsData?.comments || []}
        onAddComment={handleAddComment}
        isLoading={commentsLoading}
        onCommentAdded={handleCommentAdded}
      />
    );
  }, [handleAddComment]);

  // Loading state
  if (movieLoading || reviewsLoading) {
    return <Loader />;
  }

  // Error state
  if (movieError || reviewsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-light to-white-500 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-red-500 mb-4">
              <Film size={48} className="mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Movie Not Found</h2>
            <p className="text-gray-600 mb-4">
              {movieError?.data?.message || reviewsError?.data?.message || 'The movie you\'re looking for doesn\'t exist or has no reviews yet.'}
            </p>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => navigate('/movies')}
                className="bg-purple-main hover:bg-purple-dark text-white px-4 py-2 rounded-lg transition-colors"
              >
                Browse Movies
              </button>
              <button
                onClick={() => navigate(-1)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const movie = movieData?.movie;
  const reviews = reviewsData?.reviews || [];
  const pagination = reviewsData?.pagination || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-light to-white-500 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-purple-main hover:text-purple-dark mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>

          {/* Movie Header */}
          {movie && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="lg:flex">
                <div className="lg:w-1/3">
                  {movie.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                      alt={movie.title}
                      className="w-full h-96 lg:h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-96 lg:h-full bg-gray-200 flex items-center justify-center">
                      <Film className="text-gray-400" size={64} />
                    </div>
                  )}
                </div>
                <div className="lg:w-2/3 p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-4xl font-bold text-gray-900 mb-2">{movie.title}</h1>
                      <div className="flex items-center space-x-6 text-gray-600 mb-4">
                        <div className="flex items-center space-x-1">
                          <Calendar size={18} />
                          <span>{movie.releaseYear}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Favorites and Watch Later buttons */}
                    {userInfo && (
                      <div className="flex items-center space-x-3 ml-4">
                        <button
                          onClick={handleFavoriteToggle}
                          disabled={isActionLoading('favorite', id)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                            isFavorite(id)
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                          } ${isActionLoading('favorite', id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isActionLoading('favorite', id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          ) : (
                            <Heart size={18} className={isFavorite(id) ? 'fill-current' : ''} />
                          )}
                          <span>{isFavorite(id) ? 'Favorited' : 'Add to Favorites'}</span>
                        </button>
                        
                        <button
                          onClick={handleWatchLaterToggle}
                          disabled={isActionLoading('watchlater', id)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                            isInWatchLater(id)
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                          } ${isActionLoading('watchlater', id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isActionLoading('watchlater', id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          ) : (
                            <Clock size={18} />
                          )}
                          <span>{isInWatchLater(id) ? 'Saved' : 'Watch Later'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Genres */}
                  {movie.genres && movie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {movie.genres.map((genre, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Overview */}
                  {movie.overview && (
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {movie.overview}
                    </p>
                  )}
                  
                  {/* Additional Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    {movie.runtime && (
                      <div>
                        <strong>Runtime:</strong> {movie.runtime} minutes
                      </div>
                    )}
                    {movie.director && (
                      <div>
                        <strong>Director:</strong> {typeof movie.director === 'string' ? movie.director : movie.director.name}
                      </div>
                    )}
                    {movie.cast && movie.cast.length > 0 && (
                      <div className="col-span-2">
                        <div className="mb-3">
                          <strong className="text-gray-900">Cast:</strong>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {movie.cast.slice(0, 10).map((actor, index) => {
                            const actorName = typeof actor === 'string' ? actor : actor.name;
                            const actorImage = typeof actor === 'object' && actor.profilePath 
                              ? `https://image.tmdb.org/t/p/w185${actor.profilePath}`
                              : null;
                            
                            return (
                              <div key={index} className="flex flex-col items-center text-center group">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 group-hover:shadow-lg transition-shadow">
                                  {actorImage ? (
                                    <img
                                      src={actorImage}
                                      alt={actorName}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className={`w-full h-full ${actorImage ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200`}
                                    style={{ display: actorImage ? 'none' : 'flex' }}
                                  >
                                    <Users className="text-purple-400" size={24} />
                                  </div>
                                </div>
                                <span className="text-xs font-medium text-gray-700 line-clamp-2 leading-tight">
                                  {actorName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {movie.cast.length > 10 && (
                          <p className="text-sm text-gray-500 mt-3">
                            and {movie.cast.length - 10} more cast members...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Reviews
              </h2>
              
              {/* Admin can always create reviews */}
              {userInfo?.isAdmin && (
                <Link
                  to={`/admin/review/${id}`}
                  className="bg-purple-main hover:bg-purple-dark text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center space-x-2"
                >
                  <Eye size={18} />
                  <span>Write Review</span>
                </Link>
              )}
            </div>

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-8">
                {reviews.map(review => (
                  <div key={review._id} className="border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="text-purple-600" size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Billy</p>
                          <p className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={18}
                              className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                            />
                          ))}
                          <span className="text-sm text-gray-600 ml-2 font-medium">{review.rating}/5</span>
                        </div>
                        
                        {/* Edit button for admins */}
                        {userInfo?.isAdmin && (
                          <Link
                            to={`/admin/review/${id}?edit=${review._id}`}
                            className="flex items-center space-x-1 text-purple-main hover:text-purple-dark transition-colors text-sm"
                          >
                            <Edit size={16} />
                            <span>Edit</span>
                          </Link>
                        )}
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 text-xl mb-4">{decodeHtmlEntities(review.title)}</h4>
                    
                    {/* Enhanced review content with proper formatting - Show full by default */}
                    <div className="prose prose-lg max-w-none mb-6 text-gray-700">
                      {collapsedReviews.has(review._id) ? (
                        <>
                          {formatReviewContent(review.content.substring(0, 600))}
                          <button
                            onClick={() => toggleReviewCollapse(review._id)}
                            className="text-purple-main hover:text-purple-dark font-medium mt-2 inline-block"
                          >
                            Read more...
                          </button>
                        </>
                      ) : (
                        <>
                          {formatReviewContent(review.content)}
                          {review.content.length > 600 && (
                            <button
                              onClick={() => toggleReviewCollapse(review._id)}
                              className="text-purple-main hover:text-purple-dark font-medium mt-4 inline-block"
                            >
                              Show less
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-6">
                      <LikeButton
                        contentType="Review"
                        contentId={review._id}
                        initialLikeCount={review.likes || 0}
                        size="md"
                        variant="minimal"
                        showCount={true}
                      />
                      <CommentCount commentCount={currentCommentCount} />
                      <span>•</span>
                      <span>{review.wordCount || 0} words</span>
                      <span>•</span>
                      <span>{review.readTime || 1} min read</span>
                    </div>

                    {/* Comment Section for each review */}
                    <ReviewCommentSection
                      reviewId={review._id}
                      onCommentCountChange={setCurrentCommentCount}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="text-gray-400 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No reviews yet</h3>
                <p className="text-gray-500 mb-4">Be the first to share your thoughts about this movie!</p>
                {userInfo?.isAdmin && (
                  <Link
                    to={`/admin/review/${id}`}
                    className="bg-purple-main hover:bg-purple-dark text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <Eye size={18} />
                    <span>Write First Review</span>
                  </Link>
                )}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieReviewPage; 