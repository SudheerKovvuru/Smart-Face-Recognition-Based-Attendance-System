import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Login from './Login';
import Signup from './Signup';
import CCTVMonitor from './CCTVMonitor';
import CameraDetailRoute from './CameraDetailRoute';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children, user, requiredRoles }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Main Layout Component (handles navigation)
function MainLayout({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  // Handle tab change and navigate
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/${tab}`);
  };

  return (
    <>
      <Navbar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        user={user}
        onLogout={onLogout}
      />
      
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={
            <div className="placeholder-page">
              <h1>{user?.role === 'student' ? 'Student' : user?.role === 'faculty' ? 'Faculty' : 'Admin'} Dashboard</h1>
              <p>Dashboard content coming soon...</p>
              {user && (
                <div className="user-info">
                  <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                  <p><strong>Roll No:</strong> {user.rollNo}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                  {user.role === 'student' && (
                    <>
                      <p><strong>Branch:</strong> {user.branch?.toUpperCase()}</p>
                      <p><strong>Course:</strong> {user.course?.toUpperCase()}</p>
                      <p><strong>Year:</strong> {user.year}</p>
                      <p><strong>Section:</strong> {user.section}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          } />
          
          <Route path="/live" element={
            <ProtectedRoute user={user} requiredRoles={['admin', 'faculty']}>
              <CCTVMonitor />
            </ProtectedRoute>
          } />
          
          <Route path="/search" element={
            <div className="placeholder-page">
              <h1>Search</h1>
              <p>Search functionality coming soon...</p>
            </div>
          } />

          <Route path="/profile" element={
            <div className="placeholder-page">
              <h1>Profile</h1>
              <p>Profile page coming soon...</p>
            </div>
          } />

          <Route path="/settings" element={
            <div className="placeholder-page">
              <h1>Settings</h1>
              <p>Settings page coming soon...</p>
            </div>
          } />

          {/* Default redirect to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing user on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public Routes - Login/Signup */}
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
          } />
          
          <Route path="/signup" element={
            user ? <Navigate to="/dashboard" replace /> : <Signup />
          } />

          {/* Camera detail page - opens in new tab (Protected) */}
          <Route path="/camera/:cameraId" element={
            <ProtectedRoute user={user} requiredRoles={['admin', 'faculty']}>
              <CameraDetailRoute />
            </ProtectedRoute>
          } />

          {/* Protected Routes with Main Layout */}
          <Route path="/*" element={
            <ProtectedRoute user={user}>
              <MainLayout user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;