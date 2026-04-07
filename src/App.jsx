import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from './features/auth/authSlice';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ItemsPage from './pages/ItemsPage';
import StockPage from './pages/StockPage';
import GoodsReceivedPage from './pages/GoodsReceivedPage';
import GoodsIssuePage from './pages/GoodsIssuePage';
import GoodsReturnPage from './pages/GoodsReturnPage';
import ReportsPage from './pages/ReportsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import UsersPage from './pages/UsersPage';
import CategoriesPage from './pages/CategoriesPage';

function App() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route - Login */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } 
        />

        {/* Protected routes with layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Redirect root to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Items management */}
          <Route path="items" element={<ItemsPage />} />
          
          {/* Stock levels */}
          <Route path="stock" element={<StockPage />} />
          
          {/* Goods Received (Stock IN) */}
          <Route path="goods-received" element={<GoodsReceivedPage />} />
          
          {/* Goods Issue (Stock OUT) */}
          <Route path="goods-issue" element={<GoodsIssuePage />} />
          
          {/* Goods Return */}
          <Route path="goods-return" element={<GoodsReturnPage />} />
          
          {/* Reports */}
          <Route path="reports" element={<ReportsPage />} />
          
          {/* Analytics - Data Science */}
          <Route path="analytics" element={<AnalyticsPage />} />
          
          {/* Admin-only: Categories Management */}
          <Route
            path="categories"
            element={
              <AdminRoute>
                <CategoriesPage />
              </AdminRoute>
            }
          />

          {/* Admin-only: User Management */}
          <Route
            path="users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
        </Route>

        {/* Catch-all redirect to dashboard if authenticated, login if not */}
        <Route 
          path="*" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
