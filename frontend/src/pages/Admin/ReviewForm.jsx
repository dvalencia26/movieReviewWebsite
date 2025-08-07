import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Star, Calendar, Clock, Users } from 'lucide-react';
import StarRating from '../../components/StarRating';
import apiService from '../../services/api';
import { toast } from 'sonner';
import { decodeHtmlEntities, getWordCount, getReadTime } from '../../utils/textUtils';

const ReviewForm = () => {
  const { tmdbId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editReviewId = searchParams.get('edit');
  const isEditing = !!editReviewId;
  
  const [movieData, setMovieData] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    rating: 0
  });
  
  const [formErrors, setFormErrors] = useState({});

  // Fetch movie details and review data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!tmdbId) {
        setError('No movie ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch movie details
        const movieResponse = await apiService.getMovieDetails(tmdbId);
        setMovieData(movieResponse.data.movie);
        
        if (isEditing) {
          // Fetch existing review data
          const reviewResponse = await apiService.getReview(editReviewId);
          const review = reviewResponse.data.review;
          setReviewData(review);
          
          // Pre-fill form with existing review data 
          setFormData({
            title: decodeHtmlEntities(review.title || ''),
            content: decodeHtmlEntities(review.content || ''),
            rating: review.rating || 0
          });
        } else {
          // Pre-fill review title with movie title for new reviews
          setFormData(prev => ({
            ...prev,
            title: `Review: ${movieResponse.data.movie.title}`
          }));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to load data: ${apiService.formatError(err)}`);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tmdbId, editReviewId, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating: rating
    }));
    
    if (formErrors.rating) {
      setFormErrors(prev => ({
        ...prev,
        rating: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Review title is required';
    } else if (formData.title.length < 3) {
      errors.title = 'Review title must be at least 3 characters';
    } else if (formData.title.length > 200) {
      errors.title = 'Review title must be less than 200 characters';
    }
    
    if (!formData.content.trim()) {
      errors.content = 'Review content is required';
    } else if (formData.content.length < 10) {
      errors.content = 'Review content must be at least 10 characters';
    } else if (formData.content.length > 5000) {
      errors.content = 'Review content must be less than 5000 characters';
    }
    
    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      errors.rating = 'Please provide a rating between 1 and 5 stars';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Ensure we're sending clean, decoded text to prevent double-encoding
      const reviewData = {
        title: decodeHtmlEntities(formData.title.trim()),
        content: decodeHtmlEntities(formData.content.trim()),
        rating: formData.rating
      };
      
      let response;
      if (isEditing) {
        response = await apiService.updateReview(editReviewId, reviewData);
        toast.success('Review updated successfully!');
      } else {
        response = await apiService.submitReview(tmdbId, reviewData);
        toast.success('Review submitted successfully!');
      }
      
      navigate(`/movie/${tmdbId}`); // Redirect to movie details page
    } catch (err) {
      console.error('Error submitting review:', err);
      const errorMessage = apiService.formatError(err);
      toast.error(`Failed to ${isEditing ? 'update' : 'submit'} review: ${errorMessage}`);
      
      // Handle specific errors
      if (err.response?.status === 400 && err.response?.data?.details) {
        const fieldErrors = {};
        err.response.data.details.forEach(detail => {
          fieldErrors[detail.field] = detail.message;
        });
        setFormErrors(fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Word count and read time functions are now imported from utils

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-light to-white-500 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-main mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700">Loading Movie Details...</h3>
          <p className="text-gray-500">Please wait while we fetch the movie information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-light to-white-500 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <Star size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Movie</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-x-2">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-light to-white-500 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-purple-main hover:text-purple-dark transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Movie Selection</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Movie Information Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
                <div className="text-center mb-6">
                  <img
                    src={apiService.buildImageUrl(movieData.posterPath)}
                    alt={movieData.title}
                    className="w-full max-w-xs mx-auto rounded-lg shadow-lg"
                  />
                </div>
                
                <h2 className="text-xl font-bold text-purple-main mb-4 text-center">
                  {movieData.title}
                </h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="text-gray-400" size={16} />
                    <span className="text-gray-600">
                      {movieData.releaseDate ? new Date(movieData.releaseDate).getFullYear() : 'TBA'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="text-gray-400" size={16} />
                    <span className="text-gray-600">
                      {movieData.runtime ? `${movieData.runtime} min` : 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Star className="text-gray-400" size={16} />
                    <span className="text-gray-600">
                      {movieData.voteAverage ? `${movieData.voteAverage.toFixed(1)}/10 TMDB` : 'No rating'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Users className="text-gray-400" size={16} />
                    <span className="text-gray-600">
                      {movieData.voteCount ? `${movieData.voteCount.toLocaleString()} votes` : 'No votes'}
                    </span>
                  </div>
                </div>
                
                {movieData.genres && movieData.genres.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Genres</h4>
                    <div className="flex flex-wrap gap-2">
                      {movieData.genres.map((genre, index) => (
                        <span
                          key={index}
                          className="bg-purple-light text-purple-dark px-2 py-1 rounded-full text-xs"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {movieData.overview && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Overview</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {movieData.overview}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Review Form Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-3xl font-bold text-purple-main">
                    {isEditing ? 'Edit Review' : 'Write Review'}
                  </h1>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye size={18} />
                    <span>{previewMode ? 'Edit' : 'Preview'}</span>
                  </button>
                </div>

                {!previewMode ? (
                  // Edit Mode
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Review Title */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-black-main mb-2">
                        Review Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter a compelling title for your review"
                        className={`w-full px-4 py-3 border rounded-lg text-black-main placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-main focus:border-transparent transition-all ${
                          formErrors.title ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'
                        }`}
                        maxLength={200}
                      />
                      <div className="flex justify-between items-center mt-1">
                        {formErrors.title && (
                          <span className="text-red-500 text-sm">{formErrors.title}</span>
                        )}
                        <span className="text-gray-400 text-sm ml-auto">
                          {formData.title.length}/200
                        </span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div>
                      <label className="block text-sm font-medium text-black-main mb-3">
                        Your Rating *
                      </label>
                      <div className="flex items-center space-x-4">
                        <StarRating
                          rating={formData.rating}
                          onRatingChange={handleRatingChange}
                          size={32}
                        />
                      </div>
                      {formErrors.rating && (
                        <span className="text-red-500 text-sm mt-1 block">{formErrors.rating}</span>
                      )}
                    </div>

                    {/* Review Content */}
                    <div>
                      <label htmlFor="content" className="block text-sm font-medium text-black-main mb-2">
                        Review Content *
                      </label>
                      <textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        placeholder="Share your detailed thoughts about this movie..."
                        rows={12}
                        className={`w-full px-4 py-3 border rounded-lg text-black-main placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-main focus:border-transparent transition-all resize-vertical ${
                          formErrors.content ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'
                        }`}
                        maxLength={5000}
                      />
                      <div className="flex justify-between items-center mt-1">
                        <div className="flex space-x-4 text-sm text-gray-500">
                          <span>{getWordCount(formData.content)} words</span>
                          <span>~{getReadTime(formData.content)} min read</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {formErrors.content && (
                            <span className="text-red-500 text-sm">{formErrors.content}</span>
                          )}
                          <span className="text-gray-400 text-sm">
                            {formData.content.length}/5000
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                      <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center space-x-2 bg-purple-main text-white px-6 py-3 rounded-lg hover:bg-purple-dark transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>{isEditing ? 'Updating...' : 'Submitting...'}</span>
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            <span>{isEditing ? 'Update Review' : 'Publish Review'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  // Preview Mode
                  <div className="prose max-w-none">
                    <div className="border-b pb-4 mb-6">
                      <h2 className="text-2xl font-bold text-purple-main mb-2">
                        {formData.title ? decodeHtmlEntities(formData.title) : 'Review Title'}
                      </h2>
                      <div className="flex items-center space-x-4 text-gray-600">
                        <StarRating rating={formData.rating} readonly size={20} />
                        <span className="text-sm">
                          {getWordCount(formData.content)} words • ~{getReadTime(formData.content)} min read
                        </span>
                      </div>
                    </div>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {formData.content ? decodeHtmlEntities(formData.content) : 'Review content will appear here...'}
                    </div>
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

export default ReviewForm; 