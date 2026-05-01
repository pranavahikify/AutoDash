import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import { User, Mail, CreditCard, Upload, Calendar, Zap, Shield, ArrowLeft, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar, { MobileBottomNav } from '../components/Sidebar';
import { useState, useEffect } from 'react';
import '../styles/mobile.css';

export default function ProfilePage() {
  const { user, upgradePlan } = useAuth();
  const { history } = useDashboard();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse spotlight logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 500, damping: 50 });
  const springY = useSpring(mouseY, { stiffness: 500, damping: 50 });

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const spotlightBackground = useMotionTemplate`radial-gradient(650px circle at ${springX}px ${springY}px, rgba(37,99,235,0.15), transparent 80%)`;

  if (!user) return null;

  const stats = [
    { label: 'Total Uploads', value: history.length, icon: <Upload size={18} />, color: '#2563EB' },
    { label: 'Member Since', value: new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }), icon: <Calendar size={18} />, color: '#818CF8' },
  ];

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050B18', color: '#F0F6FF', fontFamily: 'Inter,sans-serif', position: 'relative', overflow: 'hidden' }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {!isMobile && <Sidebar collapsed={collapsed} mobileOpen={false} onMobileClose={() => {}} />}
      {isMobile && <Sidebar collapsed={false} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />}

      <main style={{ flex: 1, overflowY: 'auto', height: '100vh', position: 'relative', zIndex: 1, paddingBottom: isMobile ? 80 : 0 }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '12px 16px' : '18px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'rgba(5,11,24,0.7)', backdropFilter: 'blur(24px)',
          position: 'sticky', top: 0, zIndex: 40
        }}>
          <button onClick={() => isMobile ? setMobileOpen(true) : setCollapsed(p => !p)}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#60A5FA', cursor: 'pointer', padding: 8, borderRadius: 10, flexShrink: 0 }}>
            <Menu size={18} />
          </button>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F0F6FF' }}>Profile</h1>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '24px 14px' : '48px 24px', position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

            {/* Profile Header Card */}
            <motion.div
              className="glass-card"
              onMouseMove={handleMouseMove}
              style={{
                padding: isMobile ? '24px 18px' : '40px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? '16px' : '24px',
                flexWrap: 'wrap',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Spotlight Layer */}
              <motion.div
                style={{
                  position: 'absolute', inset: 0,
                  background: spotlightBackground,
                  pointerEvents: 'none', zIndex: 0,
                }}
              />

              {/* Avatar */}
              <div style={{
                width: isMobile ? 64 : 80,
                height: isMobile ? 64 : 80,
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #2563EB, #60A5FA, #818CF8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isMobile ? '1.6rem' : '2rem', fontWeight: 900,
                boxShadow: '0 8px 32px rgba(37,99,235,0.5)',
                flexShrink: 0, position: 'relative', zIndex: 1,
                color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {displayName[0]?.toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                <h1 style={{ fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.02em', wordBreak: 'break-word' }}>
                  {displayName}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(160,180,220,0.7)', fontSize: isMobile ? '0.8rem' : '0.9rem', marginBottom: '12px', overflow: 'hidden' }}>
                  <Mail size={13} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)',
                    color: '#34D399', borderRadius: '100px', padding: '4px 12px',
                    fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <Shield size={11} /> Verified
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {stats.map((stat, i) => (
                <StatCardWithSpotlight key={stat.label} stat={stat} index={i} isMobile={isMobile} />
              ))}
            </div>

            {/* Account Details Card */}
            <motion.div
              className="glass-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{ padding: isMobile ? '20px 18px' : '28px', marginBottom: '16px' }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 18, color: '#F0F6FF', display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} color="#60A5FA" /> Account Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ color: 'rgba(160,180,220,0.55)', fontSize: '0.85rem' }}>Email</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', wordBreak: 'break-all', textAlign: 'right' }}>{user.email}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ color: 'rgba(160,180,220,0.55)', fontSize: '0.85rem' }}>User ID</span>
                  <span style={{ fontWeight: 600, fontSize: '0.75rem', color: 'rgba(160,180,220,0.5)', fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'right', maxWidth: isMobile ? '160px' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isMobile ? 'nowrap' : 'normal' }}>{user.id}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ color: 'rgba(160,180,220,0.55)', fontSize: '0.85rem' }}>Plan</span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#34D399' }}>Free</span>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>

        {isMobile && <MobileBottomNav />}
      </main>
    </div>
  );
}

function StatCardWithSpotlight({ stat, index, isMobile }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 500, damping: 50 });
  const springY = useSpring(mouseY, { stiffness: 500, damping: 50 });

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const spotlightBackground = useMotionTemplate`radial-gradient(350px circle at ${springX}px ${springY}px, ${stat.color}25, transparent 80%)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08 }}
      className="glass-card"
      onMouseMove={handleMouseMove}
      style={{
        padding: isMobile ? '18px 16px' : '22px',
        background: `${stat.color}12`,
        border: `1px solid ${stat.color}30`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: spotlightBackground,
          pointerEvents: 'none', zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: stat.color }}>
          {stat.icon}
          <span style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(160,180,220,0.6)' }}>
            {stat.label}
          </span>
        </div>
        <div style={{ fontSize: isMobile ? '1.4rem' : '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{stat.value}</div>
      </div>
    </motion.div>
  );
}
