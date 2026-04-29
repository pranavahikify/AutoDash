import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import { User, Mail, CreditCard, Upload, Calendar, Zap, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';
import { Link, useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, upgradePlan } = useAuth();
  const { history } = useDashboard();
  const navigate = useNavigate();

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
    { label: 'Plan', value: user.user_metadata?.plan === 'pro' ? 'Pro ⭐' : 'Free', icon: <CreditCard size={18} />, color: user.user_metadata?.plan === 'pro' ? '#F59E0B' : '#60A5FA' },
    { label: 'Member Since', value: new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }), icon: <Calendar size={18} />, color: '#818CF8' },
  ];

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <div style={{ minHeight: '100vh', paddingTop: '68px', background: '#050B18', position: 'relative' }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 1 }}>

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginBottom: 28, background: 'rgba(37,99,235,0.1)',
            border: '1px solid rgba(37,99,235,0.25)', borderRadius: 10,
            padding: '9px 16px', color: '#60A5FA', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Profile Header */}
          <motion.div 
            className="glass-card" 
            onMouseMove={handleMouseMove}
            style={{ 
              padding: '40px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
              position: 'relative', overflow: 'hidden'
            }}
          >
            {/* Spotlight Layer */}
            <motion.div
              style={{
                position: 'absolute', inset: 0,
                background: spotlightBackground,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            <div style={{
              width: 80, height: 80, borderRadius: '24px',
              background: 'linear-gradient(135deg, #2563EB, #60A5FA, #818CF8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 900,
              boxShadow: '0 8px 32px rgba(37,99,235,0.5)',
              flexShrink: 0,
              position: 'relative', zIndex: 1,
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {displayName[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.02em' }}>
                {displayName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(160,180,220,0.7)', fontSize: '0.9rem', marginBottom: '12px' }}>
                <Mail size={14} /> {user.email}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  background: user.user_metadata?.plan === 'pro' ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08))' : 'rgba(37,99,235,0.15)',
                  border: `1px solid ${user.user_metadata?.plan === 'pro' ? 'rgba(245,158,11,0.4)' : 'rgba(37,99,235,0.3)'}`,
                  color: user.user_metadata?.plan === 'pro' ? '#F59E0B' : '#60A5FA',
                  borderRadius: '100px', padding: '4px 12px',
                  fontSize: '0.78rem', fontWeight: 700,
                }}>
                  {user.user_metadata?.plan === 'pro' ? '⭐ Pro Plan' : 'Free Plan'}
                </span>
                <span style={{
                  background: 'rgba(52,211,153,0.12)',
                  border: '1px solid rgba(52,211,153,0.25)',
                  color: '#34D399',
                  borderRadius: '100px', padding: '4px 12px',
                  fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <Shield size={11} /> Verified
                </span>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {stats.map((stat, i) => (
              <StatCardWithSpotlight key={stat.label} stat={stat} index={i} />
            ))}
          </div>

          {/* Upgrade nudge (if free) */}
          {user.plan === 'free' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="glass-card"
              style={{
                padding: '28px 32px',
                background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(129,140,248,0.08))',
                border: '1px solid rgba(37,99,235,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '1.05rem' }}>
                  <Zap size={16} color="#F59E0B" style={{ display: 'inline', marginRight: '7px' }} />
                  Unlock Pro for ₹50/month
                </div>
                <p style={{ color: 'rgba(160,180,220,0.65)', fontSize: '0.88rem' }}>
                  Unlimited uploads, PDF export, and advanced insights
                </p>
              </div>
              <Link to="/pricing" style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="btn-primary"
                  style={{ padding: '11px 24px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                >
                  Upgrade Now
                </motion.button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StatCardWithSpotlight({ stat, index }) {
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
        padding: '22px',
        background: `${stat.color}12`,
        border: `1px solid ${stat.color}30`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: spotlightBackground,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: stat.color }}>
          {stat.icon}
          <span style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(160,180,220,0.6)' }}>
            {stat.label}
          </span>
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{stat.value}</div>
      </div>
    </motion.div>
  );
}
