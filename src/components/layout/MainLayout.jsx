import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, logout } from '../../features/auth/authSlice';

/**
 * Main layout component with sidebar navigation and top header
 * Used for all authenticated pages
 */
const MainLayout = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Helper to determine if a route is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav className="bg-dark text-white p-3" style={{ width: '250px', minHeight: '100vh' }}>
        <h4 className="mb-4">Stock Manager</h4>
        
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <Link 
              to="/dashboard" 
              className={`nav-link text-white ${isActive('/dashboard') ? 'bg-primary rounded' : ''}`}
              style={isActive('/dashboard') ? { backgroundColor: '#0d6efd' } : {}}
            >
              <i className="bi bi-speedometer2 me-2"></i>
              Dashboard
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link 
              to="/items" 
              className={`nav-link text-white ${isActive('/items') ? 'bg-primary rounded' : ''}`}
              style={isActive('/items') ? { backgroundColor: '#0d6efd' } : {}}
            >
              <i className="bi bi-box-seam me-2"></i>
              Items
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link 
              to="/stock" 
              className={`nav-link text-white ${isActive('/stock') ? 'bg-primary rounded' : ''}`}
              style={isActive('/stock') ? { backgroundColor: '#0d6efd' } : {}}
            >
              <i className="bi bi-stack me-2"></i>
              Stock Levels
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link 
              to="/goods-received" 
              className={`nav-link text-white ${isActive('/goods-received') ? 'bg-primary rounded' : ''}`}
              style={isActive('/goods-received') ? { backgroundColor: '#0d6efd' } : {}}
            >
              <i className="bi bi-arrow-down-circle me-2"></i>
              Goods Received
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link 
              to="/goods-issue" 
              className={`nav-link text-white ${isActive('/goods-issue') ? 'bg-primary rounded' : ''}`}
              style={isActive('/goods-issue') ? { backgroundColor: '#0d6efd' } : {}}
            >
              <i className="bi bi-arrow-up-circle me-2"></i>
              Goods Issue
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link 
              to="/reports" 
              className={`nav-link text-white ${isActive('/reports') ? 'bg-primary rounded' : ''}`}
              style={isActive('/reports') ? { backgroundColor: '#0d6efd' } : {}}
            >
              <i className="bi bi-journal-text me-2"></i>
              Reports
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link 
              to="/analytics" 
              className={`nav-link text-white ${isActive('/analytics') ? 'bg-primary rounded' : ''}`}
              style={isActive('/analytics') ? { backgroundColor: '#0d6efd' } : {}}
            >
              <i className="bi bi-graph-up me-2"></i>
              Analytics
            </Link>
          </li>
          
          {/* Admin-only section */}
          {user?.is_admin && (
            <>
              <hr className="bg-secondary" />
              <li className="nav-item mb-2">
                <Link 
                  to="/categories" 
                  className={`nav-link text-white ${isActive('/categories') ? 'bg-primary rounded' : ''}`}
                  style={isActive('/categories') ? { backgroundColor: '#0d6efd' } : {}}
                >
                  <i className="bi bi-tags me-2"></i>
                  Categories
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link 
                  to="/users" 
                  className={`nav-link text-white ${isActive('/users') ? 'bg-primary rounded' : ''}`}
                  style={isActive('/users') ? { backgroundColor: '#0d6efd' } : {}}
                >
                  <i className="bi bi-people me-2"></i>
                  User Management
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Main content area */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Top header */}
        <header className="bg-light border-bottom p-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Welcome, {user?.first_name || user?.username}</h5>
            <div className="d-flex align-items-center gap-3">
              <span className="badge bg-primary">{user?.role?.toUpperCase()}</span>
              <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-grow-1 p-4 bg-light">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
