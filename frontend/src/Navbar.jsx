import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Video, Search, User, LogOut, Settings, UserCircle } from 'lucide-react';
import './Navbar.css';

function Navbar({ activeTab, onTabChange, user, onLogout }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        {/* Left - Logo and College Name */}
        <div className="navbar-left">
          <div className="logo-container">
            <div className="logo-placeholder">LOGO</div>
          </div>
          <span className="college-name">AITAM</span>
        </div>

        {/* Center - Navigation Links (only if logged in) */}
        {user && (
          <div className="navbar-center">
            <button
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => onTabChange('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
            
            {(user.role === 'admin' || user.role === 'faculty') && (
              <button
                className={`nav-link ${activeTab === 'live' ? 'active' : ''}`}
                onClick={() => onTabChange('live')}
              >
                <Video size={18} />
                <span>Live</span>
              </button>
            )}
            
            <button
              className={`nav-link ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => onTabChange('search')}
            >
              <Search size={18} />
              <span>Search</span>
            </button>
          </div>
        )}

        {/* Right - User Profile or Login/Signup */}
        <div className="navbar-right">
          {user ? (
            <div className="profile-section">
              <span className="username">{user.firstName} {user.lastName}</span>
              <div 
                className="profile-icon"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <User size={20} />
              </div>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="profile-menu">
                  <div className="profile-menu-header">
                    <div className="profile-menu-avatar">
                      <User size={24} />
                    </div>
                    <div className="profile-menu-info">
                      <div className="profile-menu-name">{user.firstName} {user.lastName}</div>
                      <div className="profile-menu-role">{user.role}</div>
                    </div>
                  </div>
                  
                  <div className="profile-menu-divider"></div>
                  
                  <button className="profile-menu-item" onClick={() => navigate('/profile')}>
                    <UserCircle size={18} />
                    <span>Profile</span>
                  </button>
                  
                  <button className="profile-menu-item" onClick={() => navigate('/settings')}>
                    <Settings size={18} />
                    <span>Settings</span>
                  </button>
                  
                  <div className="profile-menu-divider"></div>
                  
                  <button className="profile-menu-item logout" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <button className="auth-btn login-btn" onClick={() => navigate('/login')}>
                Login
              </button>
              <button className="auth-btn signup-btn" onClick={() => navigate('/signup')}>
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close dropdown */}
      {showProfileMenu && (
        <div 
          className="profile-menu-overlay"
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </nav>
  );
}

export default Navbar;