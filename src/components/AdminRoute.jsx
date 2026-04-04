import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsAdmin } from '../features/auth/authSlice';

/**
 * Admin-only Route component
 * Redirects non-admin users to dashboard and unauthenticated users to login
 */
const AdminRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    // Redirect to dashboard if authenticated but not admin
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
