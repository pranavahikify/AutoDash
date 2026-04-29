import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, CreditCard, History, User, LogOut, Menu, X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ darkMode, toggleDark }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = user
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { to: '/pricing', label: 'Pricing', icon: <CreditCard size={16} /> },
        { to: '/history', label: 'History', icon: <History size={16} /> },
      ]
    : [
        { to: '/#features', label: 'Features' },
        { to: '/#how', label: 'How It Works' },
        { to: '/pricing', label: 'Pricing' },
      ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.04 }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <div style={{
                width: 36, height: 36,
                background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(37,99,235,0.5)',
              }}>
                <Zap size={20} color="white" fill="white" />
              </div>
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '1.35rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #60A5FA, #2563EB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}>AutoDash</span>
            </motion.div>
          </Link>

          {/* Desktop Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive(link.to) ? '#60A5FA' : 'rgba(200,215,255,0.8)',
                  background: isActive(link.to) ? 'rgba(37,99,235,0.15)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  if (!isActive(link.to)) {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive(link.to)) {
                    e.currentTarget.style.color = 'rgba(200,215,255,0.8)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {link.icon && link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Dark/Light toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleDark}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '10px',
                width: 40, height: 40,
                cursor: 'pointer',
                color: '#fff',
                fontSize: '1.1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="Toggle theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </motion.button>

            {user ? (
              <div style={{ position: 'relative' }}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(37,99,235,0.15)',
                    border: '1px solid rgba(37,99,235,0.3)',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    cursor: 'pointer',
                    color: '#fff',
                  }}
                >
                  <div style={{
                    width: 28, height: 28,
                    background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
                    borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700,
                  }}>
                    {(user.user_metadata?.full_name || user.email?.split('@')[0])?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  {user.user_metadata?.plan === 'pro' && (
                    <span style={{
                      background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                      borderRadius: '6px', padding: '2px 7px',
                      fontSize: '0.7rem', fontWeight: 700,
                    }}>PRO</span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                        background: 'rgba(10,20,45,0.95)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        borderRadius: '16px',
                        padding: '8px',
                        minWidth: '180px',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        zIndex: 200,
                      }}
                    >
                      <Link to="/profile" onClick={() => setProfileOpen(false)} style={{ textDecoration: 'none' }}>
                        <div style={menuItemStyle}>
                          <User size={15} /> Profile
                        </div>
                      </Link>
                      <Link to="/pricing" onClick={() => setProfileOpen(false)} style={{ textDecoration: 'none' }}>
                        <div style={menuItemStyle}>
                          <CreditCard size={15} /> Pricing
                        </div>
                      </Link>
                      <div style={{ margin: '6px 0', borderTop: '1px solid rgba(255,255,255,0.07)' }} />
                      <div style={{ ...menuItemStyle, color: '#FC8181' }} onClick={handleLogout}>
                        <LogOut size={15} /> Logout
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/auth" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.9rem' }}>
                  Get Started
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

const menuItemStyle = {
  display: 'flex', alignItems: 'center', gap: '9px',
  padding: '10px 14px',
  borderRadius: '10px',
  fontSize: '0.88rem',
  color: 'rgba(200,215,255,0.85)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontWeight: 500,
};
