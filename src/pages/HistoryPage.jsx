import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock, Trash2, BarChart2, ArrowLeft, AlertTriangle, Menu } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050B18', color: '#F0F6FF', fontFamily: 'Inter,sans-serif', position: 'relative', overflow: 'hidden' }}>
      <div className="orb orb-1" />

      <Sidebar collapsed={collapsed} />

      <main style={{ flex: 1, overflowY: 'auto', height: '100vh', position: 'relative', zIndex: 1 }}>
        <div style={{
          padding: '18px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'rgba(5,11,24,0.7)', backdropFilter: 'blur(24px)',
          position: 'sticky', top: 0, zIndex: 40
        }}>
          <button onClick={() => setCollapsed(p => !p)}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#60A5FA', cursor: 'pointer', padding: 8, borderRadius: 10 }}>
            <Menu size={18} />
          </button>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F0F6FF' }}>History</h1>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 1 }}>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
                Upload <span className="gradient-text">History</span>
              </h1>
              <p style={{ color: 'rgba(160,180,220,0.6)', fontSize: '0.92rem' }}>
                {history.length} previous dashboard{history.length !== 1 ? 's' : ''}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
              style={{ padding: '11px 22px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '7px' }}
            >
              <BarChart2 size={16} /> New Dashboard
            </motion.button>
          </div>
        </motion.div>

        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card"
            style={{ padding: '80px 32px', textAlign: 'center' }}
          >
            <FileText size={64} color="rgba(37,99,235,0.3)" style={{ margin: '0 auto 20px', display: 'block' }} />
            <h3 style={{ fontWeight: 700, marginBottom: '10px', fontSize: '1.2rem' }}>No history yet</h3>
            <p style={{ color: 'rgba(160,180,220,0.5)', marginBottom: '24px' }}>Upload your first CSV to get started</p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
              style={{ padding: '12px 28px' }}
            >
              Upload CSV
            </motion.button>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {history.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className="glass-card"
                style={{
                  padding: '22px 28px',
                  display: 'flex', alignItems: 'center', gap: '18px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={async () => {
                  const success = await loadHistoryItem(entry);
                  if (success) navigate('/dashboard');
                }}
                whileHover={{ scale: 1.015, borderColor: 'rgba(37,99,235,0.3)' }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: '14px', flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(96,165,250,0.15))',
                  border: '1px solid rgba(37,99,235,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={22} color="#60A5FA" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.name}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#60A5FA', fontSize: '0.82rem', fontWeight: 600 }}>
                      {(entry.rows || entry.summary?.rows || 0).toLocaleString()} rows
                    </span>
                    {entry.summary?.cols && (
                      <span style={{ color: 'rgba(160,180,220,0.55)', fontSize: '0.82rem' }}>
                        {entry.summary.cols} columns
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(160,180,220,0.4)', fontSize: '0.8rem', flexShrink: 0 }}>
                    <Clock size={13} />
                    {timeAgo(entry.date)}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.2, color: '#EF4444' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteItem(entry);
                    }}
                    style={{
                      background: 'none', border: 'none', padding: '8px', cursor: 'pointer',
                      color: 'rgba(160,180,220,0.3)', transition: 'color 0.2s'
                    }}
                  >
                    <Trash2 size={18} />
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
                style={{ maxWidth: '400px', width: '100%', padding: '32px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <div style={{ 
                  width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                  color: '#EF4444'
                }}>
                  <AlertTriangle size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>Delete Dashboard?</h3>
                <p style={{ color: 'rgba(160,180,220,0.6)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '28px' }}>
                  Are you sure you want to delete <span style={{ color: '#fff', fontWeight: 600 }}>"{deleteItem.name}"</span>? This action cannot be undone.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    onClick={() => setDeleteItem(null)}
                    style={{
                      padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 600, cursor: 'pointer'
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
                      padding: '12px', borderRadius: '12px', border: 'none',
                      background: '#EF4444', color: '#fff', fontWeight: 700, cursor: 'pointer'
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
      </main>
    </div>
  );
}
