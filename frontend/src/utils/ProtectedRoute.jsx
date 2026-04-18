import { Navigate, Outlet,useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
// Prevents "flicker" redirects to /login while the app is verifying the JWT.
  if (loading) return <div>Verifying Session...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // If the user hasn't changed their default password, lock them out of the app.
  // The 'pathname' check prevents an infinite redirect loop.
  if (user?.must_change_password && location.pathname !== '/force-password-change') {
    return <Navigate to="/force-password-change" replace />;
  }
  //if the user is not 'admin', redirect to dashboard
  //if they evr try to access staffManagment
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />; 
  }
//render child components
return <Outlet />;
};

export default ProtectedRoute;