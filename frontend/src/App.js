import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import CandidateProfile from './pages/CandidateProfile';
import Clients from './pages/Clients';
import Jobs from './pages/Jobs';
import Pipeline from './pages/Pipeline';
import Interviews from './pages/Interviews';
import Users from './pages/Users';
import ResumeScanner from './pages/ResumeScanner';
import GmailImport from './pages/GmailImport';
import MasterLogin from './pages/MasterLogin';
import MasterDashboard from './pages/MasterDashboard';
import BulkResumeUpload from './pages/BulkResumeUpload';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ErrorBoundary from './components/ErrorBoundary';
import PublicCareers from './pages/PublicCareers';
import JobBoards from './pages/JobBoards';

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
      {/* Master Admin — fully standalone */}
      <Route path="/master" element={<MasterLogin />} />
      <Route path="/master/dashboard" element={<MasterDashboard />} />

      {/* Auth pages — no layout */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      {/* Main ATS app */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

<Route path="/careers/:companyId" element={<PublicCareers />} />
<Route path="/job-boards" element={<JobBoards />} />

        <Route path="candidates" element={
          <PrivateRoute roles={['super_admin', 'recruiter']}>
            <Candidates />
          </PrivateRoute>
        } />
        <Route path="candidates/:id" element={
          <PrivateRoute roles={['super_admin', 'recruiter']}>
            <CandidateProfile />
          </PrivateRoute>
        } />
        <Route path="bulk-upload" element={
          <PrivateRoute roles={['super_admin', 'recruiter']}>
            <BulkResumeUpload />
          </PrivateRoute>
        } />
        <Route path="pipeline" element={
          <PrivateRoute roles={['super_admin', 'recruiter']}>
            <Pipeline />
          </PrivateRoute>
        } />
        <Route path="jobs" element={<Jobs />} />
        <Route path="clients" element={
          <PrivateRoute roles={['super_admin']}>
            <Clients />
          </PrivateRoute>
        } />
        <Route path="interviews" element={
          <PrivateRoute roles={['super_admin', 'recruiter']}>
            <Interviews />
          </PrivateRoute>
        } />
        <Route path="resume-scanner" element={
          <PrivateRoute roles={['super_admin', 'recruiter']}>
            <ResumeScanner />
          </PrivateRoute>
        } />
        <Route path="gmail-import" element={
          <PrivateRoute roles={['super_admin']}>
            <GmailImport />
          </PrivateRoute>
        } />
        <Route path="users" element={
          <PrivateRoute roles={['super_admin']}>
            <Users />
          </PrivateRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{
            style: { background: '#1a2235', color: '#f1f5f9', border: '1px solid #1e293b' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
          }} />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}