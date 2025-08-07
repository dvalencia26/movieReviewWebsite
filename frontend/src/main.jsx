import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import store from './redux/store.js'
import { Provider } from 'react-redux'
import { Route, RouterProvider, createRoutesFromElements, createBrowserRouter } from 'react-router-dom'

// Auth
import AdminRoute from './pages/Admin/AdminRoute.jsx'
import GenreList from './pages/Admin/GenreList.jsx'
import MovieSelectionPageOptimized from './pages/Admin/MovieSelectionPageOptimized.jsx'
import ReviewForm from './pages/admin/ReviewForm.jsx'
//import EditReview from './pages/Admin/EditReview.jsx'
import AdminDashboard from './pages/Admin/Dashboard/AdminDashboard.jsx'
import AdminUsers from './pages/Admin/AdminUsers.jsx'
import AdminComments from './pages/Admin/AdminComments.jsx'

// Restricted 
import Login from './pages/Auth/Login.jsx'
import Register from './pages/Auth/Register.jsx'
import PrivateRoute from './pages/Auth/PrivateRoute.jsx'

import Home from './pages/home.jsx'
import Movies from './pages/Movies.jsx'
import MovieReviewPage from './pages/MovieReviewPage.jsx'
import Favorites from './pages/User/Favorites.jsx'
import Profile from './pages/User/profile.jsx'
import AdminProfile from './pages/AdminProfile.jsx'

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<App />}>
            <Route index={true} element={<Home />} />
            <Route path="/about" element={<AdminProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<PrivateRoute />}>
                <Route path="/movies" element={<Movies />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/movie/:id" element={<MovieReviewPage />} />
            </Route>

            <Route path="/admin" element={<AdminRoute />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="movies/genres" element={<GenreList />} />
                <Route path="movies" element={<MovieSelectionPageOptimized />} />
                <Route path="review/:tmdbId" element={<ReviewForm />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="comments" element={<AdminComments />} />
            </Route>
        </Route>
    )
);

ReactDOM.createRoot(document.getElementById('root')).render(
    <Provider store={store}>
        <RouterProvider router={router} />
    </Provider>
);