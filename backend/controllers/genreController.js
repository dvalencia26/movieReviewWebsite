import Genre from "../models/Genre.js";
import Movie from "../models/Movie.js";
import tmdbService from "../services/tmdbService.js";
import asyncHandler from "../middlewares/asyncHandler.js";

const createGenre = asyncHandler(async (req, res) => {
    try {
        const { name } = req.body;
        if (!name){
            return res.json({error: "Genre name is required"});
        }

        const existingGenre = await Genre.findOne({name});
        if (existingGenre){
            return res.json({error: "Genre already exists"});
        }

        const genre = await new Genre({name}).save();
        res.json(genre);
    } catch (error) {
        console.log(error);
        return res.status(400).json(error.message);
    }
});

const updateGenre = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const genre = await Genre.findOne({_id: id});
        if (!genre){
            return res.status(404).json({error: "Genre not found"});
        }

        genre.name = name;

        const updatedGenre = await genre.save();
        res.json(updatedGenre);
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal server error"});
    }
});

const removeGenre = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const removed = await Genre.findByIdAndDelete(id);
        if (!removed){
            return res.status(404).json({error: "Genre not found"});
        }
        res.json(removed);
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal server error"});
    }
});

const getAllGenres = asyncHandler(async (req, res) => {
    try{
        const allGenres = await Genre.find({});
        res.json(allGenres);
    } catch (error) {
        console.log(error);
        return res.status(400).json({error: "Internal server error"});
    }
});

const getGenreById = asyncHandler(async (req, res) => {
    try{
        const { id } = req.params;
        const genre = await Genre.findById(id);
        res.json(genre);
    }
    catch (error) {
        console.log(error);
        return res.status(400).json(error.message);
    }
});

// Sync TMDB genres with local Genre model
const syncTMDBGenres = asyncHandler(async (req, res) => {
    try {
        console.log('🔄 Starting TMDB genre sync...');
        
        // Get TMDB genres
        const tmdbGenres = await tmdbService.getMovieGenres();
        
        if (!tmdbGenres || !tmdbGenres.genres) {
            return res.status(500).json({
                error: 'Failed to fetch TMDB genres',
                message: 'Could not retrieve genres from TMDB'
            });
        }
        
        let created = 0;
        let existing = 0;
        
        // Create genres that don't exist
        for (const tmdbGenre of tmdbGenres.genres) {
            const existingGenre = await Genre.findOne({ name: tmdbGenre.name });
            
            if (!existingGenre) {
                await new Genre({ name: tmdbGenre.name }).save();
                created++;
                console.log(`➕ Created genre: ${tmdbGenre.name}`);
            } else {
                existing++;
            }
        }
        
        console.log(`✅ Genre sync completed: ${created} created, ${existing} existing`);
        
        res.json({
            message: 'TMDB genres synced successfully',
            stats: {
                created,
                existing,
                total: tmdbGenres.genres.length
            }
        });
    } catch (error) {
        console.error('Error syncing TMDB genres:', error);
        res.status(500).json({
            error: 'Failed to sync TMDB genres',
            message: error.message
        });
    }
});

// Update movie genre relationships
const updateMovieGenres = asyncHandler(async (req, res) => {
    try {
        console.log('🔄 Starting movie genre relationship update...');
        
        // Get all movies
        const movies = await Movie.find({});
        let updated = 0;
        let errors = 0;
        
        for (const movie of movies) {
            try {
                if (movie.genres && movie.genres.length > 0) {
                    // Find matching genres in our database
                    const matchingGenres = await Genre.find({
                        name: { $in: movie.genres }
                    });
                    
                    if (matchingGenres.length > 0) {
                        // Update the movie's genre reference (use first matching genre)
                        movie.genre = matchingGenres[0]._id;
                        await movie.save();
                        updated++;
                        console.log(`🔗 Updated genres for: ${movie.title}`);
                    }
                }
            } catch (error) {
                console.error(`Error updating movie ${movie.title}:`, error);
                errors++;
            }
        }
        
        console.log(`✅ Movie genre update completed: ${updated} updated, ${errors} errors`);
        
        res.json({
            message: 'Movie genre relationships updated successfully',
            stats: {
                updated,
                errors,
                total: movies.length
            }
        });
    } catch (error) {
        console.error('Error updating movie genres:', error);
        res.status(500).json({
            error: 'Failed to update movie genres',
            message: error.message
        });
    }
});

// Get genre statistics
const getGenreStats = asyncHandler(async (req, res) => {
    try {
        const totalGenres = await Genre.countDocuments();
        const genresWithMovies = await Movie.aggregate([
            { $match: { genre: { $exists: true, $ne: null } } },
            { $group: { _id: "$genre", count: { $sum: 1 } } },
            { $count: "total" }
        ]);
        
        const genreDistribution = await Movie.aggregate([
            { $match: { genre: { $exists: true, $ne: null } } },
            { $group: { _id: "$genre", movieCount: { $sum: 1 } } },
            { $lookup: { from: "genres", localField: "_id", foreignField: "_id", as: "genreInfo" } },
            { $unwind: "$genreInfo" },
            { $project: { _id: 0, genre: "$genreInfo.name", movieCount: 1 } },
            { $sort: { movieCount: -1 } }
        ]);
        
        res.json({
            totalGenres,
            genresWithMovies: genresWithMovies.length > 0 ? genresWithMovies[0].total : 0,
            distribution: genreDistribution
        });
    } catch (error) {
        console.error('Error getting genre stats:', error);
        res.status(500).json({
            error: 'Failed to get genre statistics',
            message: error.message
        });
    }
});

export { 
    createGenre, 
    updateGenre, 
    removeGenre, 
    getAllGenres, 
    getGenreById, 
    syncTMDBGenres,
    updateMovieGenres,
    getGenreStats
};
