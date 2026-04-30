import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  RadialBarChart, RadialBar, ComposedChart, Treemap
} from 'recharts';
import {
  LayoutDashboard, User, History, CreditCard, LogOut,
  Upload, TrendingUp, TrendingDown, Search, Bell, Menu,
  ChevronDown, MoreVertical, Brain, 
  Filter, Download, Zap, RefreshCcw, Eye, Map, FileJson, 
  FileText as FilePdf, Image as FilePng, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';
import {
  classifyColumns, buildChartData, aggregateByCategory,
  getStats, fmt, getAIInsights, parseNum
} from '../utils/csvAnalyzer';
import toast from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

const PALETTE = ['#0EA5E9', '#10B981', '#6366F1', '#8B5CF6', '#F59E0B', '#EF4444', '#14B8A6', '#3B82F6'];

/* ── Custom Treemap Content ──────────────────────────── */
const CustomTreemapContent = ({ depth, x, y, width, height, index, colors, name }) => (
  <g>
    <rect x={x} y={y} width={width} height={height}
      style={{ fill: colors[index % colors.length], stroke: '#fff', strokeWidth: 1 }} />
    {width > 30 && height > 20 && (
      <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={700}>
        {name}
      </text>
    )}
  </g>
);

/* ── Custom Tooltip ───────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card" style={{ 
      background: 'rgba(10, 18, 40, 0.95)', 
      border: '1px solid rgba(255,255,255,0.12)', 
      borderRadius: 16, 
      padding: '14px 18px', 
      fontSize: '0.88rem',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(20px)'
    }}>
      <p style={{ color: 'rgba(160,180,220,0.7)', fontWeight: 600, marginBottom: 10, letterSpacing: '0.02em' }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 800, display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <span>{p.name}:</span>
          <span>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Trend Badge ─────────────────────────────────────── */
const TrendBadge = ({ pct }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.78rem', fontWeight: 700,
    color: pct >= 0 ? '#10B981' : '#EF4444', background: pct >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: 20
  }}>
    {pct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
    {Math.abs(pct)}%
  </span>
);

/* ── Chart Card ──────────────────────────────────────── */
const ChartCard = ({ title, badge, children, style = {} }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
    className="glass-card"
    style={{
      padding: '24px', ...style
    }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#F0F6FF', letterSpacing: '-0.01em' }}>{title}</div>
        {badge}
      </div>
      <MoreVertical size={16} style={{ color: 'rgba(160,180,220,0.4)', cursor: 'pointer' }} />
    </div>
    {children}
  </motion.div>
);

/* ── Stat Card ───────────────────────────────────────── */
const StatCard = ({ label, value, trend, delay = 0, color = '#0EA5E9' }) => (
  <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
    className="glass-card"
    style={{
      padding: '24px', flex: '1 1 160px', minWidth: 150,
      position: 'relative', overflow: 'hidden',
      borderLeft: `4px solid ${color.includes('gradient') ? '#0EA5E9' : color}`
    }}>
    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(160,180,220,0.5)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#F0F6FF', marginBottom: 14, letterSpacing: '-0.03em' }}>{value}</div>
    <TrendBadge pct={trend} />
    {/* Subtle glow background */}
    <div style={{ 
      position: 'absolute', top: '-20%', right: '-10%', width: '100px', height: '100px', 
      background: color.includes('gradient') ? color : color, 
      filter: 'blur(50px)', opacity: 0.1, pointerEvents: 'none' 
    }} />
  </motion.div>
);

/* ── Sidebar ─────────────────────────────────────────── */
const Sidebar = ({ collapsed, onToggle }) => {
  const { logout } = useAuth();
  const nav = useNavigate();
  const items = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
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
};

/* ── Upload Drop Zone ────────────────────────────────── */
const UploadZone = ({ onLoad }) => {
  const { saveToHistory } = useDashboard();
  const [busy, setBusy] = useState(false);
  const onDrop = useCallback(files => {
    const f = files[0]; if (!f) return;
    setBusy(true);
    Papa.parse(f, {
      header: true, skipEmptyLines: true,
      complete: res => {
        setBusy(false);
        if (!res.data.length) return toast.error('CSV is empty');
        onLoad(res.data, f.name);
        saveToHistory(f.name, { rows: res.data.length, cols: Object.keys(res.data[0]).length });
        toast.success(`✅ Loaded ${res.data.length} rows`);
      },
      error: () => { setBusy(false); toast.error('Parse error'); }
    });
  }, [onLoad]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] }, multiple: false });
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <motion.div {...getRootProps()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-card"
        style={{
          width: '100%', maxWidth: 550, border: `2px dashed ${isDragActive ? '#2563EB' : 'rgba(255,255,255,0.12)'}`,
          padding: '80px 48px', textAlign: 'center', cursor: 'pointer',
          background: isDragActive ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.02)', 
          transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
          boxShadow: isDragActive ? '0 0 60px rgba(37,99,235,0.2)' : '0 20px 40px rgba(0,0,0,0.3)'
        }}>
        <input {...getInputProps()} />
        <motion.div 
          animate={isDragActive ? { y: -10 } : { y: 0 }}
          style={{
            width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,#2563EB,#60A5FA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', 
            boxShadow: '0 12px 32px rgba(37,99,235,0.5)'
          }}
        >
          <Upload size={36} color="#fff" />
        </motion.div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 12, color: '#F0F6FF', letterSpacing: '-0.02em' }}>
          {busy ? 'Processing...' : 'Drop your CSV here'}
        </h3>
        <p style={{ color: 'rgba(160,180,220,0.6)', fontSize: '1.05rem' }}>or click to browse · .csv files only</p>
      </motion.div>
    </div>
  );
};

/* ══ MAIN DASHBOARD ════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useAuth();
  const { csvData, headers, fileName, loadCSV, history } = useDashboard();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview | insights | data
  const [liveMode, setLiveMode] = useState(false);
  const [filterQuery, setFilterQuery] = useState({}); // column-based filters
  const [showFilters, setShowFilters] = useState(false);
  const [template, setTemplate] = useState('default'); // default | sales | marketing
  const [liveData, setLiveData] = useState(null);

  /* ── Analyse CSV columns ── */
  const cols = csvData ? classifyColumns(headers, csvData) : { numeric:[], dates:[], text:[], ids:[] };
  const labelCol = cols.dates[0] || cols.text[0] || cols.ids[0] || headers[0];
  const numCols  = cols.numeric;
  const metrics  = numCols.filter(c => !/id|key|guid|uid|index|year|zip|code|phone|lat|lon|hash/i.test(c));
  const hasMetrics = metrics.length > 0;

  /* ── Filtered Data ── */
  const filteredData = (csvData || []).filter(row => {
    const term = search.toLowerCase().trim();
    if (!term) return true;

    // Multi-token search: each word in the search must match at least one column
    const tokens = term.split(/\s+/);
    const matchesGlobal = tokens.every(token => 
      Object.values(row).some(v => String(v).toLowerCase().includes(token))
    );
    if (!matchesGlobal) return false;

    // Column-specific filters
    return Object.entries(filterQuery).every(([col, val]) => {
      if (!val) return true;
      return String(row[col]).toLowerCase().includes(val.toLowerCase().trim());
    });
  });

  /* ── Live Mode Simulation (Jitter) ── */
  useEffect(() => {
    if (!liveMode || !csvData) {
      setLiveData(null);
      return;
    }
    
    // Reset live data when underlying filter changes to ensure search is reactive
    setLiveData(null);

    const timer = setInterval(() => {
      setLiveData(prev => {
        // If liveData was just reset (null), use the fresh filteredData
        const base = prev || filteredData;
        return base.map(row => {
          const newRow = { ...row };
          metrics.forEach(m => {
            if (Math.random() > 0.7) {
              const val = parseNum(row[m]);
              newRow[m] = (val * (0.98 + Math.random() * 0.04)).toFixed(2);
            }
          });
          return newRow;
        });
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [liveMode, csvData, metrics, filteredData]);

  const activeData = liveData || filteredData;

  const tableRowsData = activeData.slice(0, 15);
  const insights = csvData ? getAIInsights(activeData, cols) : [];
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  /* ── Chart Selection Logic ── */
  const [chartConfig, setChartConfig] = useState({
    areaIdx: 0,
    barIdx: 0,
    scatterXIdx: 0,
    scatterYIdx: 1,
    barLimit: 8
  });

  const m1 = hasMetrics ? (metrics[chartConfig.areaIdx % metrics.length] || metrics[0]) : 'Count';
  const m2 = hasMetrics ? (metrics[chartConfig.scatterYIdx % (metrics.length || 1)] || metrics[1] || m1) : null;
  const mb = hasMetrics ? (metrics[chartConfig.barIdx % metrics.length] || metrics[0]) : null;

  /* ── Chart data ── */
  const areaData = csvData ? buildChartData(activeData, labelCol, hasMetrics ? metrics : []).map(d => ({ 
    ...d, 
    Count: d.Count ?? 1 
  })) : [];

  const catCol = cols.text.find(c => c !== labelCol) || cols.text[0] || cols.ids[0];
  const barData = (csvData && catCol)
    ? aggregateByCategory(activeData, catCol, mb).slice(0, chartConfig.barLimit)
    : [];

  const st1 = hasMetrics ? getStats(activeData, m1) : { sum: activeData?.length || 0, avg: 1, trend: 0 };
  const st2 = (hasMetrics && m2 && m2 !== m1) ? getStats(activeData, m2) : null;
  const uniqueCats = catCol ? new Set(activeData.map(r => r[catCol])).size : 0;

  const statCards = [
    { label: 'Total Rows', value: fmt(activeData.length), trend: 0, color: 'linear-gradient(135deg,#2563EB,#1D4ED8)' }
  ];
  if (st1) {
    statCards.push({ label: `Total ${m1}`, value: fmt(st1.sum), trend: st1.trend, color: 'linear-gradient(135deg,#F59E0B,#D97706)' });
    statCards.push({ label: `Avg ${m1}`, value: fmt(st1.avg), trend: st1.trend, color: 'linear-gradient(135deg,#10B981,#059669)' });
  }
  if (catCol && statCards.length < 4) {
    statCards.push({ label: `Unique ${catCol}`, value: fmt(uniqueCats), trend: 0, color: 'linear-gradient(135deg,#EC4899,#BE185D)' });
  }

  const exportAsImage = () => {
    toast.success('Generating PNG report...');
  };

  /* ── Table ── */
  // Using tableRowsData from above

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050B18', color: '#F0F6FF', fontFamily: 'Inter,sans-serif', position: 'relative', overflow: 'hidden' }}>
      {/* Background Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />

      <main style={{ flex: 1, overflowY: 'auto', height: '100vh', position: 'relative', zIndex: 1 }}>
        {/* ── Header ── */}
        <div style={{
          padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: 16, 
          background: 'rgba(5, 11, 24, 0.6)',
          position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(24px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.button 
              whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCollapsed(p => !p)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#60A5FA', cursor: 'pointer', padding: 8, borderRadius: 10 }}>
              <Menu size={20} />
            </motion.button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '1.6rem', fontWeight: 900, margin: 0, color: '#F0F6FF', letterSpacing: '-0.02em' }}>
                  Welcome, {userName}
                </h1>
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <Sparkles size={18} color="#F59E0B" />
                </motion.div>
              </div>
              {fileName && <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'rgba(160,180,220,0.55)', fontWeight: 500 }}>
                📄 {fileName} · <span style={{ color: '#60A5FA' }}>{filteredData?.length} rows</span> · {headers.length} cols
              </p>}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {/* Live Toggle */}
            <div 
              onClick={() => setLiveMode(!liveMode)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', 
                background: liveMode ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                padding: '8px 14px', borderRadius: 12, border: `1px solid ${liveMode ? '#10B981' : 'rgba(255,255,255,0.08)'}`,
                transition: 'all 0.3s'
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: liveMode ? '#10B981' : '#64748B', boxShadow: liveMode ? '0 0 10px #10B981' : 'none' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: liveMode ? '#10B981' : 'rgba(160,180,220,0.6)' }}>LIVE MODE</span>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(160,180,220,0.5)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Global search..."
                className="glass-input"
                style={{
                  paddingLeft: 40, paddingRight: 16, paddingTop: 10, paddingBottom: 10, borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#F0F6FF', fontSize: '0.9rem', outline: 'none', width: 220, fontWeight: 500,
                  transition: 'all 0.3s'
                }} />
            </div>

            <motion.button 
              whileHover={{ scale: 1.05 }} onClick={exportAsImage}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#F0F6FF', padding: '10px 14px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={16} /> <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Export</span>
            </motion.button>
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {!csvData ? <UploadZone onLoad={loadCSV} /> : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              {/* ── Tab Switcher & Conditional Controls ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  {activeTab === 'overview' && (
                    <>
                      <button onClick={() => setShowFilters(!showFilters)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: showFilters ? '#60A5FA' : '#fff', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                        <Filter size={16} /> Filters
                      </button>
                      <select 
                        value={template} 
                        onChange={e => setTemplate(e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }}
                      >
                        <option value="default">Default View</option>
                        <option value="sales">Sales Template</option>
                        <option value="marketing">Marketing View</option>
                      </select>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 12 }}>
                  {['overview', 'insights', 'data'].map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setActiveTab(tab)}
                      style={{ 
                        padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase',
                        background: activeTab === tab ? 'rgba(37,99,235,0.15)' : 'transparent',
                        color: activeTab === tab ? '#60A5FA' : 'rgba(160,180,220,0.5)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Advanced Filters ── */}
              <AnimatePresence>
                {activeTab === 'overview' && showFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', marginBottom: 20 }}
                  >
                    <div className="glass-card" style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                      {headers.slice(0, 8).map(h => (
                        <div key={h}>
                          <label style={{ fontSize: '0.7rem', color: 'rgba(160,180,220,0.5)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>{h}</label>
                          <input 
                            placeholder={`Filter ${h}...`} 
                            onChange={e => setFilterQuery(p => ({ ...p, [h]: e.target.value }))}
                            className="glass-input" 
                            style={{ width: '100%', fontSize: '0.82rem', padding: '8px 12px' }} 
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {activeTab === 'overview' && (
                <>
                  {/* ── Stat Cards ── */}
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
                    {statCards.slice(0, 4).map((card, i) => (
                      <StatCard key={card.label} label={card.label} value={card.value}
                        trend={card.trend} delay={i * 0.08} color={card.color} />
                    ))}
                  </div>

                  {/* ── Unified Dashboard Grid ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24, gridAutoFlow: 'dense' }}>

                    {/* 1. Primary Trend (Area Chart) */}
                    {m1 && (
                      <div style={{ gridColumn: 'span 2', gridRow: 'span 1' }}>
                        <ChartCard title={`${m1} Performance Trend`} badge={st1 && <TrendBadge pct={st1.trend} />}>
                          <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <defs>
                                <linearGradient id="glowBlue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
                              <Tooltip content={<CustomTooltip />} />
                              <Area type="monotone" dataKey={m1} stroke="#60A5FA" fill="url(#glowBlue)" strokeWidth={3}
                                activeDot={{ r: 6, fill: '#fff', stroke: '#2563EB', strokeWidth: 3 }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </ChartCard>
                      </div>
                    )}

                    {/* 2. Category Distribution (Pie Chart) */}
                    {catCol && barData.length > 0 && (
                      <div style={{ gridColumn: 'span 1' }}>
                        <ChartCard title={`${catCol} Distribution`}>
                          <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                              <Pie data={barData} cx="50%" cy="45%" innerRadius={60} outerRadius={85}
                                dataKey="value" paddingAngle={4} startAngle={90} endAngle={-270} stroke="none">
                                {barData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                              <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'rgba(160,180,220,0.6)', paddingTop: 10 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </ChartCard>
                      </div>
                    )}

                    {/* 3. Category Comparison (Bar Chart) */}
                    {catCol && barData.length > 0 && (
                      <div style={{ gridColumn: 'span 1' }}>
                        <ChartCard title={`${catCol} Comparison`} badge={<span style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 600 }}>Top 8</span>}>
                          <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={barData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={24}>
                                {barData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartCard>
                      </div>
                    )}

                    {/* 4. Multi-metric Comparison (Line Chart) */}
                    {metrics.length > 1 && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <ChartCard title="Metric Convergence">
                          <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={areaData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'rgba(160,180,220,0.7)' }} />
                              {metrics.slice(0, 3).map((col, i) => (
                                <Line key={col} type="monotone" dataKey={col} stroke={PALETTE[i]} strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartCard>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'insights' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <ChartCard title="🧠 AI Insights" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                      {insights.map((ins, i) => (
                        <motion.div 
                          key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                          style={{ 
                            padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex', gap: 16, alignItems: 'flex-start'
                          }}
                        >
                          <div style={{ 
                            width: 40, height: 40, borderRadius: 12, background: ins.sentiment === 'positive' ? 'rgba(16,185,129,0.1)' : (ins.sentiment === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(37,99,235,0.1)'),
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            {ins.type === 'trend' ? <TrendingUp size={20} color="#60A5FA" /> : <Brain size={20} color="#818CF8" />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#F0F6FF', marginBottom: 4 }}>{ins.title}</div>
                            <div style={{ fontSize: '0.88rem', color: 'rgba(160,180,220,0.7)', lineHeight: 1.5 }}>{ins.text}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      style={{ marginTop: 20, width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#2563EB,#6366F1)', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                    >
                      <Brain size={18} /> Deep Data Explanation (AI Mode)
                    </motion.button>
                  </ChartCard>
                  
                  <ChartCard title="🗺️ Location Mapping (Simulated)">
                    <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 16 }}>
                       <Map size={48} color="rgba(160,180,220,0.2)" />
                       <span style={{ marginLeft: 16, color: 'rgba(160,180,220,0.4)', fontWeight: 600 }}>Map visualization requires geolocation data</span>
                    </div>
                  </ChartCard>

                  <ChartCard title="📊 Distribution Matrix">
                    <ResponsiveContainer width="100%" height={260}>
                       <ScatterChart margin={{ top: 15, right: 15, bottom: 0, left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis type="number" dataKey={m1} tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                          <YAxis type="number" dataKey={m2 || m1} tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                          <Scatter name="Data" data={areaData} fill={PALETTE[0]} fillOpacity={0.6} />
                       </ScatterChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              )}

              {activeTab === 'data' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>

                  <ChartCard title="📋 Full Data Explorer" badge={<span style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 700 }}>{filteredData.length} records</span>}>
                    <div style={{ marginBottom: 20, position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(160,180,220,0.5)' }} />
                      <input 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        placeholder="Search by ID, Name, or any field..." 
                        className="glass-input"
                        style={{ width: '100%', paddingLeft: 42, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                      />
                    </div>
                    <div className="scroll-x" style={{ width: '100%', paddingBottom: 16 }}>
                      <table style={{ width: '100%', minWidth: 'max-content', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            {headers.map(h => (
                              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(160,180,220,0.6)', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableRowsData.map((row, ri) => (
                            <tr key={ri} style={{ background: ri % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                              {headers.map(h => (
                                <td key={h} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(210,225,255,0.8)', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row[h]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ChartCard>
                </div>
              )}


              {/* Upload new floating */}
              <div style={{ textAlign: 'right', marginTop: 14 }}>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={() => loadCSV(null, '')}
                  style={{
                    padding: '11px 22px', borderRadius: 12, background: 'rgba(37,99,235,0.15)',
                    border: '1px solid rgba(37,99,235,0.3)', color: '#60A5FA', cursor: 'pointer',
                    fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700
                  }}>
                  <RefreshCcw size={16} /> New Data Source
                </motion.button>
              </div>

            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
