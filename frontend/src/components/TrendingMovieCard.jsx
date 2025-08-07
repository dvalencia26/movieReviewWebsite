import React from 'react';
import { Link } from 'react-router-dom';

const TrendingMovieCard = ({ poster, title, tmdbId }) => {
  const posterUrl = poster ? `https://image.tmdb.org/t/p/w500${poster}` : null;
  
  return (
    <Link to={`/movie/${tmdbId}`} className="flex flex-col items-center w-48 hover:scale-105 transition-transform duration-300">
      <div className="w-44 h-64 flex items-center justify-center bg-white rounded-lg shadow-md mb-2">
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
      <div className="text-black-main font-bold text-lg text-center leading-tight line-clamp-2">
        {title}
      </div>
    </Link>
  );
};

export default TrendingMovieCard; 