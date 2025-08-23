import React from 'react';

// Skeleton loader for movie cards
export const MovieCardSkeleton = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-gray-200 rounded-xl aspect-[2/3] mb-4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

// Skeleton loader for favorite movie carousel
export const FavoriteMovieSkeleton = () => (
  <div className="animate-pulse">
    <div className="flex flex-col lg:flex-row bg-white rounded-2xl shadow-lg overflow-hidden min-h-96">
      {/* Left side - Poster */}
      <div className="lg:w-1/3 w-full h-64 lg:h-auto bg-gray-200"></div>
      
      {/* Right side - Content */}
      <div className="lg:w-2/3 w-full p-8 space-y-6">
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="flex space-x-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-5 h-5 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
        
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  </div>
);

// Skeleton loader for review cards
export const ReviewCardSkeleton = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-gray-200 rounded-xl aspect-video mb-4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="flex items-center space-x-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  </div>
);

// Section skeleton loader
export const SectionSkeleton = ({ title, children }) => (
  <section className="mb-16">
    <h2 className="text-3xl font-bold text-black-main mb-6">{title}</h2>
    {children}
  </section>
);

export default {
  MovieCardSkeleton,
  FavoriteMovieSkeleton,
  ReviewCardSkeleton,
  SectionSkeleton
};