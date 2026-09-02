import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <main className="auth-loading">Checking your session...</main>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
}

export default PublicRoute;
