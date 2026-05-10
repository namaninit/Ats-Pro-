import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import Clients from './pages/Clients';
import Jobs from './pages/Jobs';
import Pipeline from './pages/Pipeline';
import Interviews from './pages/Interviews';
import Users from './pages/Users';
import ResumeScanner from './pages/ResumeScanner';
import GmailImport from './pages/GmailImport';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="clients" element={<Clients />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="resume-scanner" element={<ResumeScanner />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="gmail-import" element={<GmailImport />} />
        <Route path="interviews" element={<Interviews />} />
        <Route path="users" element={<PrivateRoute roles={['super_admin']}><Users /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a2235', color: '#f1f5f9', border: '1px solid #1e293b' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
