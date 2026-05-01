import { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import AIAnalysisPage from './pages/AIAnalysisPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#050B18',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '20px',
    }}>
      <div style={{
        width: 60, height: 60,
        border: '3px solid rgba(37,99,235,0.2)',
        borderTop: '3px solid #2563EB',
        borderRadius: '50%',
        animation: 'spin 0.9s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'rgba(160,180,220,0.5)', fontSize: '0.9rem' }}>Loading AutoDash...</p>
    </div>
  );
}

function AppInner() {
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();
  
  const showNav = useMemo(() => {
    const hiddenNavRoutes = ['/dashboard', '/ai-analysis', '/profile', '/history'];
    return !hiddenNavRoutes.includes(location.pathname);
  }, [location.pathname]);

  return (
    <div style={{
      background: darkMode ? '#050B18' : '#F8FAFF',
      color: darkMode ? '#F0F6FF' : '#0D1B3E',
      minHeight: '100vh',
      transition: 'background 0.4s ease, color 0.4s ease',
    }}>
      {showNav && <Navbar darkMode={darkMode} toggleDark={() => setDarkMode(d => !d)} />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/history"
          element={<ProtectedRoute><HistoryPage /></ProtectedRoute>}
        />
        <Route
          path="/profile"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />
        <Route
          path="/ai-analysis"
          element={<ProtectedRoute><AIAnalysisPage /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(10,20,45,0.95)',
            color: '#F0F6FF',
            border: '1px solid rgba(37,99,235,0.3)',
            borderRadius: '12px',
            backdropFilter: 'blur(20px)',
            fontSize: '0.9rem',
          },
          success: { iconTheme: { primary: '#34D399', secondary: '#050B18' } },
          error: { iconTheme: { primary: '#FC8181', secondary: '#050B18' } },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DashboardProvider>
          <AppInner />
        </DashboardProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
