import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './styles/global.css';

// Pages
import LandingPage      from './pages/LandingPage';
import RolePicker       from './pages/RolePicker';
import OwnerLanding     from './pages/OwnerLanding';
import UserLanding      from './pages/UserLanding';
import NgoLanding       from './pages/NgoLanding';
import AuthPage         from './pages/AuthPage';
import OwnerDashboard   from './pages/owner/OwnerDashboard';
import UserDashboard    from './pages/user/UserDashboard';
import NgoDashboard     from './pages/ngo/NgoDashboard';

// Protected route: redirect to /login if not logged in or wrong role
function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login/user" replace />;
  if (user.role !== role) return <Navigate to={`/dashboard/${user.role}`} replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                  element={<LandingPage />} />
      <Route path="/pick-role"         element={<RolePicker />} />
      <Route path="/for/owner"         element={<OwnerLanding />} />
      <Route path="/for/user"          element={<UserLanding />} />
      <Route path="/for/ngo"           element={<NgoLanding />} />
      <Route path="/login/:role"       element={<AuthPage tab="login" />} />
      <Route path="/register/:role"    element={<AuthPage tab="register" />} />

      {/* Protected dashboards */}
      <Route path="/dashboard/owner"   element={<ProtectedRoute role="owner"><OwnerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/user"    element={<ProtectedRoute role="user"><UserDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/ngo"     element={<ProtectedRoute role="ngo"><NgoDashboard /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={user ? <Navigate to={`/dashboard/${user.role}`} /> : <Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
