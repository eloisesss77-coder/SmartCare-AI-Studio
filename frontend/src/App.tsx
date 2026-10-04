import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppLayout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import ElderlyList from '@/pages/ElderlyList';
import ElderlyDetail from '@/pages/ElderlyDetail';
import AlertCenter from '@/pages/AlertCenter';
import UserManagement from '@/pages/UserManagement';
import DeviceManagement from '@/pages/DeviceManagement';
import BindManagement from '@/pages/BindManagement';
import AlertRules from '@/pages/AlertRules';
import NotFound from '@/pages/NotFound';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const SafeRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<SafeRoute><Dashboard /></SafeRoute>} />
        <Route path="/elderly" element={<SafeRoute><ElderlyList /></SafeRoute>} />
        <Route path="/elderly/:id" element={<SafeRoute><ElderlyDetail /></SafeRoute>} />
        <Route path="/devices" element={<SafeRoute><DeviceManagement /></SafeRoute>} />
        <Route path="/alerts" element={<SafeRoute><AlertCenter /></SafeRoute>} />
        <Route path="/alert-rules" element={<SafeRoute><AlertRules /></SafeRoute>} />
        <Route path="/bind" element={<SafeRoute><BindManagement /></SafeRoute>} />
        <Route path="/users" element={<AdminRoute><SafeRoute><UserManagement /></SafeRoute></AdminRoute>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
