import profileImage from '../assets/profileImage.jpg';
import { useGetAdminFavoriteMoviesQuery, useGetAdminWatchLaterMoviesQuery, useGetTotalReviewsCountQuery } from '../redux/api/movies';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import { Film, Star, Clock } from 'lucide-react';
import Footer from '../components/Footer';

function AdminProfile() {
    // Fetch admin-specific data
    const { data: favoritesData, isLoading: favoritesLoading } = useGetAdminFavoriteMoviesQuery({ limit: 3 });
    const { data: watchLaterData, isLoading: watchLaterLoading } = useGetAdminWatchLaterMoviesQuery({ limit: 3 });
    const { data: totalReviewsData, isLoading: statsLoading } = useGetTotalReviewsCountQuery();

    // Get the data for each section
    const recentFavorites = favoritesData?.movies || [];
    const recentWatchLater = watchLaterData?.movies || [];
    const totalReviews = totalReviewsData?.totalReviews || 0;
    return (
        <div className="min-h-screen bg-white-500">
            <main className="flex flex-col items-center py-8">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-6xl w-full">
                    {/* Profile Header */}
                    <div className="flex flex-col items-center mb-8">
                        <img src={profileImage} alt="Profile" className="w-32 h-32 rounded-full border-4 border-purple-main mb-4 shadow-md object-cover" />
                        <article className="text-center text-purple-main max-w-4xl">
                            <h2 className="text-3xl font-bold text-purple-main mb-2">WG</h2>
                            <h3 className="text-xl font-semibold text-green-dark mb-2">About me</h3>
                            <p className="text-black-light leading-relaxed">
                                I am a retired Army combat medic. I served two tours in Iraq—the second of which was cut short because of a brain injury.
                                I have a large extended family, and see my Mom pretty much every week (yeh, I'm kind of a mamma's boy).
                                I grew up in Pinellas County, Florida (the St. Petersburg-Clearwater beaches) and now live a little further south in
                                Sarasota. 
                            </p>
                            <br />
                            <p className='text-black-light leading-relaxed'>
                                One of the things I still enjoy is movies. I've watched a bunch of them. This site is where
                                I share my favorites, highlighting the stories and the actors I enjoy the most. I've been
                                told I sometimes have unusual taste in movies and I do tend to watch my favorites
                                multiple times. (C'mon, you can't get too much of a monkey driving a car in Grandma's
                                Boy!) 
                            </p>
                            <br />
                            <p className='text-black-light leading-relaxed'>
                            I hope you enjoy my site and that you'll chime in and leave your comments too.
                        </p>
                    </article>
                    </div>

                    {/* New Sections */}
                    <div className="mt-12 space-y-8">
                        {/* Favorite Movies Section */}
                        <section>
                            <div className="flex items-center space-x-3 mb-6">
                                <Star className="text-yellow-500" size={24} />
                                <h3 className="text-2xl font-bold text-purple-main">Favorite Movies</h3>
                            </div>
                            {favoritesLoading ? (
                                <Loader />
                            ) : recentFavorites.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {recentFavorites.map((movie) => (
                                        <MovieCard
                                            key={movie.tmdbId || movie._id}
                                            movie={{
                                                tmdbId: movie.tmdbId,
                                                title: movie.title,
                                                posterPath: movie.posterPath,
                                                releaseDate: movie.releaseDate,
                                                averageRating: movie.averageRating,
                                            }}
                                            variant="detailed"
                                            showActions={false}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Film size={48} className="mx-auto mb-4 text-gray-300" />
                                    <p>No favorite movies yet</p>
                                </div>
                            )}
                        </section>

                        {/* Total Reviews Section */}
                        <section>
                            <div className="flex items-center space-x-3 mb-6">
                                <Film className="text-green-dark" size={24} />
                                <h3 className="text-2xl font-bold text-purple-main">Movie Reviews</h3>
                            </div>
                            {statsLoading ? (
                                <Loader />
                            ) : (
                                <div className="bg-gradient-to-r from-green-light/20 to-purple-light/20 rounded-xl p-8 text-center">
                                    <div className="text-4xl font-bold text-green-dark mb-2">{totalReviews}</div>
                                    <p className="text-lg text-gray-700">
                                        {totalReviews === 1 ? 'Movie Review Written' : 'Movie Reviews Written'}
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* Watch List Section */}
                        <section>
                            <div className="flex items-center space-x-3 mb-6">
                                <Clock className="text-blue-500" size={24} />
                                <h3 className="text-2xl font-bold text-purple-main">Watch List</h3>
                            </div>
                            {watchLaterLoading ? (
                                <Loader />
                            ) : recentWatchLater.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {recentWatchLater.map((movie) => (
                                        <MovieCard
                                            key={movie.tmdbId}
                                            movie={{
                                                tmdbId: movie.tmdbId,
                                                title: movie.title,
                                                posterPath: movie.posterPath,
                                                releaseDate: movie.releaseDate,
                                                vote_average: movie.voteAverage,
                                                overview: movie.overview
                                            }}
                                            variant="detailed"
                                            showActions={false}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                                    <p>No movies in watch list yet</p>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default AdminProfile;