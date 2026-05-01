import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, History, LogOut, Brain, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const items = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
  { label: 'AI Analysis', icon: <Brain size={18} />, path: '/ai-analysis' },
  { label: 'Profile', icon: <User size={18} />, path: '/profile' },
  { label: 'History', icon: <History size={18} />, path: '/history' },
];

/* ── Desktop / Tablet Sidebar ── */
export default function Sidebar({ collapsed, mobileOpen, onMobileClose }) {
  const { logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const cur = location.pathname;

  const handleNav = (path) => {
    nav(path);
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 199,
              backdropFilter: 'blur(4px)',
            }}
          />
        )}
      </AnimatePresence>

      <aside style={{
        width: collapsed ? 80 : 240,
        minHeight: '100vh',
        background: 'rgba(5, 11, 24, 0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 200,
        backdropFilter: 'blur(32px)',
        // Mobile: fixed overlay from left
        ...(window.innerWidth <= 768 ? {
          position: 'fixed',
          left: mobileOpen ? 0 : '-280px',
          top: 0,
          height: '100vh',
          width: 260,
          boxShadow: mobileOpen ? '0 0 60px rgba(0,0,0,0.7)' : 'none',
        } : {}),
      }}>
        {/* Logo + close button on mobile */}
        <div style={{ padding: '28px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg,#2563EB,#60A5FA)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 8px 24px rgba(37,99,235,0.4)'
            }}>
              <LayoutDashboard size={18} color="#fff" />
            </div>
            {(!collapsed || window.innerWidth <= 768) && (
              <span style={{
                fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.35rem',
                background: 'linear-gradient(135deg,#F0F6FF,#60A5FA)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em'
              }}>AutoDash</span>
            )}
          </div>
          {/* Close button on mobile */}
          {window.innerWidth <= 768 && (
            <button onClick={onMobileClose} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: 6, color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <X size={16} />
            </button>
          )}
        </div>

        <nav style={{ flex: 1, padding: '8px 14px' }}>
          {items.map(item => {
            const active = cur === item.path;
            return (
              <motion.button
                key={item.label}
                onClick={() => handleNav(item.path)}
                whileHover={{ x: 4 }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 14, padding: '13px 16px',
                  borderRadius: 14, marginBottom: 6, cursor: 'pointer',
                  background: active ? 'rgba(37,99,235,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(37,99,235,0.25)' : '1px solid transparent',
                  color: active ? '#60A5FA' : 'rgba(160,180,220,0.6)',
                  fontSize: '0.92rem', fontWeight: active ? 700 : 500,
                  transition: 'all 0.3s',
                  justifyContent: (collapsed && window.innerWidth > 768) ? 'center' : 'flex-start',
                }}>
                <div style={{ color: active ? '#60A5FA' : 'inherit', flexShrink: 0 }}>{item.icon}</div>
                {(!collapsed || window.innerWidth <= 768) && <span>{item.label}</span>}
              </motion.button>
            );
          })}
        </nav>

        <button onClick={() => { logout(); nav('/'); }}
          style={{
            margin: '16px 14px', padding: '13px 16px',
            borderRadius: 14, display: 'flex', alignItems: 'center',
            gap: 14, background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: '#F87171', cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600,
            transition: 'all 0.3s',
            justifyContent: (collapsed && window.innerWidth > 768) ? 'center' : 'flex-start',
          }}>
          <LogOut size={18} />
          {(!collapsed || window.innerWidth <= 768) && <span>Logout</span>}
        </button>
      </aside>
    </>
  );
}

/* ── Mobile Bottom Navigation Bar ── */
export function MobileBottomNav() {
  const nav = useNavigate();
  const location = useLocation();
  const cur = location.pathname;
  const { logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { label: 'AI', icon: <Brain size={20} />, path: '/ai-analysis' },
    { label: 'Profile', icon: <User size={20} />, path: '/profile' },
    { label: 'History', icon: <History size={20} />, path: '/history' },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map(item => {
        const active = cur === item.path;
        return (
          <button
            key={item.path}
            onClick={() => nav(item.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              color: active ? '#60A5FA' : 'rgba(160,180,220,0.45)',
              fontSize: '0.65rem', fontWeight: active ? 700 : 500,
              padding: '4px 12px',
              position: 'relative',
              transition: 'color 0.2s',
            }}>
            {active && (
              <motion.div
                layoutId="nav-indicator"
                style={{
                  position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                  width: 28, height: 3, borderRadius: 2,
                  background: 'linear-gradient(90deg, #2563EB, #60A5FA)',
                }}
              />
            )}
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
