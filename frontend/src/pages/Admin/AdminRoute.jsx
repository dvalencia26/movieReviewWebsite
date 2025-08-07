import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

/* This is a private route for admin users. */
const AdminRoute = () => {
    // Get user info from redux store
    const { userInfo } = useSelector((state) => state.auth);

    return userInfo && userInfo.isAdmin ? (
        <Outlet />
    ) : (
        <Navigate to="/login" replace />
    );
};

export default AdminRoute;