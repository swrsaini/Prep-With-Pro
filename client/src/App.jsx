import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { PomodoroProvider } from './context/PomodoroContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import PortalLayout from './layouts/PortalLayout';
import Dashboard from './pages/Dashboard';
import PracticeEngine from './pages/PracticeEngine';
import MockExam from './pages/MockExam';
import Categories from './pages/Categories';
import Bookmarks from './pages/Bookmarks';
import IncorrectBank from './pages/IncorrectBank';
import Analytics from './pages/Analytics';
import AddQuestion from './pages/AddQuestion';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

function PortalShell() {
  return <section className="view-pane active" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<PortalLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="practice" element={<PracticeEngine />} />
          <Route path="mock" element={<MockExam />} />
          <Route path="categories" element={<Categories />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="incorrect" element={<IncorrectBank />} />
          <Route path="analytics" element={<Analytics />} />
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="add-question" element={<AddQuestion />} />
          </Route>
          <Route path="settings" element={<Settings />} />
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          <PomodoroProvider>
            <AppRoutes />
          </PomodoroProvider>
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
