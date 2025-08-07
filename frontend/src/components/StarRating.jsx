import { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating, onRatingChange, maxRating = 5, size = 24, readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (value) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleStarHover = (value) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  return (
    <div className="flex items-center space-x-1" onMouseLeave={handleMouseLeave}>
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        const isActive = starValue <= (hoverRating || rating);
        
        return (
          <button
            key={index}
            type="button"
            className={`transition-all duration-200 ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            } ${isActive ? 'text-yellow-400' : 'text-gray-300'}`}
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => handleStarHover(starValue)}
            disabled={readonly}
          >
            <Star
              size={size}
              fill={isActive ? 'currentColor' : 'none'}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
      {rating > 0 && (
        <span className="ml-2 text-sm font-medium text-gray-600">
          {rating} out of {maxRating}
        </span>
      )}
    </div>
  );
};

export default StarRating; 