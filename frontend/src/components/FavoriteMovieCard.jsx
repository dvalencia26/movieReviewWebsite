import React from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { truncateText } from '../utils/textUtils';

const FavoriteMovieCard = ({ poster, title, rating, description, reviewText, link }) => {
  // Use TMDB poster URL if poster is present
  const posterUrl = poster ? `https://image.tmdb.org/t/p/w500${poster}` : null;
  return (
    <div className="flex flex-col lg:flex-row items-center bg-purple-50 rounded-xl p-6 lg:p-8 shadow-lg mx-4 h-full">
      <div className="w-40 lg:w-48 h-60 lg:h-72 flex items-center justify-center bg-white rounded-lg shadow-md mb-4 lg:mb-0 lg:mr-8 flex-shrink-0">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <span className="text-gray-400 text-center">No Image</span>
        )}
      </div>
      <div className="flex-1 text-center lg:text-left">
        <div className="flex flex-col lg:flex-row lg:items-center mb-2">
          <Link to={link} className="text-xl lg:text-2xl xl:text-3xl font-bold text-purple-900 underline mr-0 lg:mr-4 hover:text-purple-main line-clamp-2">
            {title}
          </Link>
          <div className="flex items-center justify-center lg:justify-start ml-0 lg:ml-4 mt-2 lg:mt-0">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={24} className={i < rating ? 'text-green-400 fill-green-400' : 'text-gray-300'} />
            ))}
          </div>
        </div>
        <p className="text-black-main text-base lg:text-lg mb-2 line-clamp-3">{description}</p>
        <div className="mt-4">
          <div className="text-purple-main font-bold text-lg mb-1">Review</div>
          <div className="text-black-light text-sm lg:text-base line-clamp-4">{reviewText ? truncateText(reviewText, 200) : 'No review yet.'}</div>
        </div>
      </div>
    </div>
  );
};

export default FavoriteMovieCard; 