import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock, Trash2, BarChart2, ArrowLeft, AlertTriangle, Menu } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar, { MobileBottomNav } from '../components/Sidebar';
import '../styles/mobile.css';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function HistoryPage() {
  const { history, loadHistoryItem, deleteHistoryItem } = useDashboard();
  const navigate = useNavigate();
  const [deleteItem, setDeleteItem] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050B18', color: '#F0F6FF', fontFamily: 'Inter,sans-serif', position: 'relative', overflow: 'hidden' }}>
      <div className="orb orb-1" />

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
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F0F6FF' }}>Upload History</h1>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '20px 14px' : '48px 24px', position: 'relative', zIndex: 1 }}>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

            {/* Title Row */}
            <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: '28px', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0 }}>
              <div>
                <h1 style={{ fontSize: isMobile ? '1.6rem' : 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                  Upload <span className="gradient-text">History</span>
                </h1>
                <p style={{ color: 'rgba(160,180,220,0.6)', fontSize: '0.88rem', margin: 0 }}>
                  {history.length} previous dashboard{history.length !== 1 ? 's' : ''}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
                style={{ padding: isMobile ? '10px 18px' : '11px 22px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '7px', alignSelf: isMobile ? 'flex-start' : 'auto' }}
              >
                <BarChart2 size={16} /> New Dashboard
              </motion.button>
            </div>

          </motion.div>

          {history.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card"
              style={{ padding: isMobile ? '48px 20px' : '80px 32px', textAlign: 'center' }}
            >
              <FileText size={48} color="rgba(37,99,235,0.3)" style={{ margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ fontWeight: 700, marginBottom: '10px', fontSize: '1.1rem' }}>No history yet</h3>
              <p style={{ color: 'rgba(160,180,220,0.5)', marginBottom: '20px', fontSize: '0.9rem' }}>Upload your first CSV to get started</p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
                style={{ padding: '11px 24px' }}
              >
                Upload CSV
              </motion.button>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                  className="glass-card"
                  style={{
                    padding: isMobile ? '16px 14px' : '22px 28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '12px' : '18px',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={async () => {
                    const success = await loadHistoryItem(entry);
                    if (success) navigate('/dashboard');
                  }}
                  whileHover={{ scale: 1.01, borderColor: 'rgba(37,99,235,0.3)' }}
                >
                  {/* File Icon */}
                  <div style={{
                    width: isMobile ? 40 : 48,
                    height: isMobile ? 40 : 48,
                    borderRadius: '12px', flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(96,165,250,0.15))',
                    border: '1px solid rgba(37,99,235,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileText size={isMobile ? 18 : 22} color="#60A5FA" />
                  </div>

                  {/* File Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: isMobile ? '0.88rem' : '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.name}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ color: '#60A5FA', fontSize: '0.78rem', fontWeight: 600 }}>
                        {(entry.rows || entry.summary?.rows || 0).toLocaleString()} rows
                      </span>
                      {entry.summary?.cols && (
                        <span style={{ color: 'rgba(160,180,220,0.55)', fontSize: '0.78rem' }}>
                          {entry.summary.cols} cols
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time + Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '12px', flexShrink: 0 }}>
                    {!isMobile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(160,180,220,0.4)', fontSize: '0.78rem' }}>
                        <Clock size={12} />
                        {timeAgo(entry.date)}
                      </div>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.2, color: '#EF4444' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteItem(entry);
                      }}
                      style={{
                        background: 'none', border: 'none', padding: '6px', cursor: 'pointer',
                        color: 'rgba(160,180,220,0.3)', transition: 'color 0.2s', display: 'flex'
                      }}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {deleteItem && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 100, padding: '20px'
              }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="glass-card"
                  style={{ maxWidth: '400px', width: '100%', padding: isMobile ? '24px 20px' : '32px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
                    color: '#EF4444'
                  }}>
                    <AlertTriangle size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>Delete Dashboard?</h3>
                  <p style={{ color: 'rgba(160,180,220,0.6)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '24px' }}>
                    Are you sure you want to delete <span style={{ color: '#fff', fontWeight: 600 }}>"{deleteItem.name}"</span>? This cannot be undone.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      onClick={() => setDeleteItem(null)}
                      style={{
                        padding: '11px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await deleteHistoryItem(deleteItem);
                        setDeleteItem(null);
                      }}
                      style={{
                        padding: '11px', borderRadius: '12px', border: 'none',
                        background: '#EF4444', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>

        {isMobile && <MobileBottomNav />}
      </main>
    </div>
  );
}
