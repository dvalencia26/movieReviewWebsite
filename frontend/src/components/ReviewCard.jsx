import React from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReviewCard = ({ image, title, rating, tmdbId }) => {
  const posterUrl = image ? `https://image.tmdb.org/t/p/w500${image}` : null;
  return (
    <Link to={`/movie/${tmdbId}`} className="relative rounded-xl overflow-hidden shadow-md group cursor-pointer h-48 hover:scale-105 transition-transform duration-300">
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">No Image</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-4">
        <div className="text-white text-lg font-bold mb-1 line-clamp-1">{title}</div>
        <div className="flex items-center mb-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={16} className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'} />
          ))}
        </div>
      </div>
    </Link>
  );
};

export default ReviewCard; 