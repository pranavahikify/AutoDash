import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, History, LogOut, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ collapsed }) {
  const { logout } = useAuth();
  const nav = useNavigate();
  const items = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
    { label: 'AI Analysis', icon: <Brain size={18} />, path: '/ai-analysis' },
    { label: 'Profile', icon: <User size={18} />, path: '/profile' },
    { label: 'History', icon: <History size={18} />, path: '/history' },
  ];
  const cur = window.location.pathname;

  return (
    <aside style={{
      width: collapsed ? 80 : 240, minHeight: '100vh', 
      background: 'rgba(5, 11, 24, 0.7)',
      borderRight: '1px solid rgba(255,255,255,0.06)', 
      display: 'flex', flexDirection: 'column',
      transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)', 
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 50,
      backdropFilter: 'blur(32px)'
    }}>
      <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 38, height: 38, background: 'linear-gradient(135deg,#2563EB,#60A5FA)',
          borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', 
          flexShrink: 0, boxShadow: '0 8px 24px rgba(37,99,235,0.4)'
        }}>
          <LayoutDashboard size={18} color="#fff" />
        </div>
        {!collapsed && <span style={{
          fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.4rem',
          background: 'linear-gradient(135deg,#F0F6FF,#60A5FA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em'
        }}>AutoDash</span>}
      </div>
      <nav style={{ flex: 1, padding: '14px 16px' }}>
        {items.map(item => {
          const active = cur === item.path;
          return (
            <motion.button 
              key={item.label} 
              onClick={() => nav(item.path)}
              whileHover={{ x: 4 }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderRadius: 14, marginBottom: 8, cursor: 'pointer',
                background: active ? 'rgba(37,99,235,0.12)' : 'transparent',
                border: active ? '1px solid rgba(37,99,235,0.25)' : '1px solid transparent',
                color: active ? '#60A5FA' : 'rgba(160,180,220,0.6)',
                fontSize: '0.92rem', fontWeight: active ? 700 : 500, transition: 'all 0.3s'
              }}>
              <div style={{ color: active ? '#60A5FA' : 'inherit' }}>{item.icon}</div>
              {!collapsed && <span>{item.label}</span>}
            </motion.button>
          );
        })}
      </nav>
      <button onClick={() => { logout(); nav('/'); }}
        style={{
          margin: '24px 16px', padding: '14px 16px', borderRadius: 14, display: 'flex', alignItems: 'center',
          gap: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
          color: '#F87171', cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600,
          transition: 'all 0.3s'
        }}>
        <LogOut size={18} />
        {!collapsed && <span>Logout</span>}
      </button>
    </aside>
  );
}
