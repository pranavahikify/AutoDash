import { motion } from 'framer-motion';
import { FileText, Clock, Trash2, BarChart2, ArrowLeft } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { useNavigate } from 'react-router-dom';

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
  const { history, loadHistoryItem } = useDashboard();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', paddingTop: '68px', background: '#050B18', position: 'relative' }}>
      <div className="orb orb-1" />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 1 }}>

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
                }}
                onClick={async () => {
                  await loadHistoryItem(entry);
                  navigate('/dashboard');
                }}
                whileHover={{ scale: 1.015 }}
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
                    <span style={{ color: '#60A5FA', fontSize: '0.82rem' }}>
                      {entry.rows?.toLocaleString()} rows
                    </span>
                    {entry.summary?.cols && (
                      <span style={{ color: 'rgba(160,180,220,0.55)', fontSize: '0.82rem' }}>
                        {entry.summary.cols} columns
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(160,180,220,0.45)', fontSize: '0.8rem', flexShrink: 0 }}>
                  <Clock size={13} />
                  {timeAgo(entry.date)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
