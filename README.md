# WAG Movie Reviews

WAG Movie Reviews is a movie review platform that connects movie enthusiasts with entertaining reviews. Built with modern web technologies, it offers a seamless experience for both administrators who write detailed movie reviews and users who discover, like, and comment on their favorite film reviews.

## Project Features

For Administrators
- **Secure Admin Dashboard** - Protected admin interface for content management.
- **Movie Database Access** - Browse and search through TMDB's extensive movie catalog.
- **Review Creation System** - Write detailed reviews with ratings, titles, and content.
- **Review Management** - Edit, publish, and manage existing reviews.

For authenticated users
- **Interactive Comments** - Users can leave comments on reviews to engage in discussions.
- **Personal Collections** - Add movies to favorites and watch later lists.
- **Movie Search** - Search movies by title, genre, or release year.
- **Secure Authentication** - JWT-based user authentication and authorization.
- **Performance Optimized** - Caching and rate limiting for efficient API calls.

## Prerequisites
- Node.js (v14 or higher)
- MongoDB
- TMDB API key

## Installation

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd WAGmovieReviews
```

### 2. Install dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database Configuration
DB_URI=mongodb://localhost:27017/your_database_name

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# TMDB API Configuration
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_BASE_URL=https://api.themoviedb.org/3

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. Get TMDB API Key

1. Visit [TMDB](https://www.themoviedb.org/)
2. Create an account
3. Go to Settings > API
4. Request an API key
5. Add the API key to your `.env` file

## Running the Application

The application can be run in two ways:

#### Option 1: Run Both Frontend and Backend Simultaneously
```bash
# From the root directory
npm run fullstack
```

#### Option 2: Run Frontend and Backend Separately
```bash
# Start the backend server
cd backend
npm start

# Start the frontend development server
cd frontend
npm run dev
```

## Project Structure

```
WAGmovieReviews/
├── backend/          # Node.js/Express API
│   ├── config/      # Database configuration
│   ├── controllers/ # Route controllers
│   ├── middlewares/ # Custom middlewares
│   ├── models/      # MongoDB models
│   ├── routes/      # API routes
│   ├── services/    # External API services
│   └── utils/       # Utility functions
├── frontend/        # React application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── redux/      # Redux store and slices
│   │   └── services/   # API services
│   └── public/         # Static assets
└── uploads/         # User uploaded files
```
## Technology Stack

### Backend
- **Node.js & Express** - Server-side runtime and web framework
- **MongoDB** - Database
- **JWT Authentication** - Secure user sessions

### Frontend
- **React 19** - Modern React with latest features
- **Redux Toolkit** - State management with RTK Query
- **Tailwind CSS** - Utility-first styling framework
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **Axios** - HTTP client for API requests
- **Sonner** - Toast notifications