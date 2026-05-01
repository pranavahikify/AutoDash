import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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
  FileText as FilePdf, Image as FilePng, Sparkles, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';
import {
  classifyColumns, buildChartData, aggregateByCategory,
  getStats, fmt, getAIInsights, parseNum,
  getSmartSummary, generateExplanation, getDetailedStats, getCorrelation
} from '../utils/csvAnalyzer';
import toast from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import ViewEngine, { ViewDropdown } from '../components/ViewEngine';
import Sidebar, { MobileBottomNav } from '../components/Sidebar';
import '../styles/mobile.css';

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

/* ── Insight Item ─────────────────────────────────────── */
const InsightItem = ({ ins, index }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: index * 0.1 }}
      className="glow-border"
      style={{ 
        padding: 24, borderRadius: 20, 
        background: 'rgba(255,255,255,0.02)', 
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', gap: 16,
        position: 'relative', overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ 
          width: 44, height: 44, borderRadius: 14, 
          background: ins.sentiment === 'positive' ? 'rgba(16,185,129,0.1)' : (ins.sentiment === 'warning' ? 'rgba(239,68,68,0.1)' : 'rgba(37,99,235,0.1)'),
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          fontSize: '1.2rem'
        }}>
          {ins.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontWeight: 800, color: '#F0F6FF', fontSize: '1.05rem' }}>{ins.title}</div>
            <div style={{ 
              fontSize: '0.65rem', fontWeight: 900, padding: '3px 8px', borderRadius: 20,
              background: 'rgba(255,255,255,0.05)', color: ins.confidence === 'High' ? '#10B981' : '#F59E0B'
            }}>
              {ins.confidence} Confidence
            </div>
          </div>
          <div style={{ fontSize: '0.92rem', color: 'rgba(180,200,240,0.75)', lineHeight: 1.6 }}>{ins.text}</div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div style={{ fontSize: '0.82rem', color: 'rgba(160,180,220,0.8)', fontStyle: 'italic', display: 'flex', gap: 8 }}>
              <Sparkles size={14} color="#60A5FA" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{generateExplanation(ins)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setExpanded(!expanded)}
        style={{ 
          marginTop: 4, width: '100%', padding: '10px', borderRadius: 10, 
          background: expanded ? 'rgba(255,255,255,0.06)' : 'rgba(37,99,235,0.1)', 
          color: expanded ? '#fff' : '#60A5FA', border: 'none', fontWeight: 700, 
          cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.3s'
        }}
      >
        <Brain size={14} /> {expanded ? 'Hide Explanation' : 'Explain Insight'}
      </motion.button>
    </motion.div>
  );
};

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


/* ── Filter Dropdown Component ────────────────────────── */
const FilterDropdown = ({ column, data, currentFilter, onUpdate, onClose }) => {
  const isNum = !isNaN(parseNum(data[0]?.[column])) && data.some(r => parseNum(r[column]) !== 0);
  const [search, setSearch] = useState('');
  
  const uniqueValues = useMemo(() => {
    const set = new Set(data.map(r => String(r[column])));
    return Array.from(set).sort((a, b) => isNum ? parseNum(a) - parseNum(b) : a.localeCompare(b));
  }, [data, column, isNum]);

  const filteredValues = useMemo(() => 
    uniqueValues.filter(v => v.toLowerCase().includes(search.toLowerCase())),
    [uniqueValues, search]
  );
  
  const selectedValues = currentFilter?.type === 'set' ? currentFilter.values : uniqueValues;

  const toggleValue = (val) => {
    let next;
    if (selectedValues.includes(val)) {
      next = selectedValues.filter(v => v !== val);
    } else {
      next = [...selectedValues, val];
    }
    onUpdate({ type: 'set', values: next });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      style={{
        position: 'absolute', top: '100%', left: 0, zIndex: 9999, marginTop: 8,
        width: 260, background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', padding: 16,
        backdropFilter: 'blur(20px)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'rgba(160,180,220,0.8)', textTransform: 'uppercase' }}>{column}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>DONE</button>
      </div>

      {isNum && (
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#60A5FA', marginBottom: 8 }}>NUMERIC RANGE</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['gt', 'lt', 'between'].map(op => (
              <button 
                key={op}
                onClick={() => onUpdate({ type: 'num', op, val: '', min: '', max: '' })}
                style={{ 
                  padding: '4px 10px', borderRadius: 8, fontSize: '0.7rem', cursor: 'pointer',
                  background: currentFilter?.op === op ? '#2563EB' : 'rgba(255,255,255,0.05)',
                  border: 'none', color: '#fff', fontWeight: 600
                }}
              >
                {op === 'gt' ? '>' : op === 'lt' ? '<' : 'Range'}
              </button>
            ))}
          </div>
          {currentFilter?.type === 'num' && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              {currentFilter.op === 'between' ? (
                <>
                  <input placeholder="Min" className="glass-input" style={{ width: '50%', padding: '8px' }} value={currentFilter.min || ''} onChange={e => onUpdate({ ...currentFilter, min: e.target.value })} />
                  <input placeholder="Max" className="glass-input" style={{ width: '50%', padding: '8px' }} value={currentFilter.max || ''} onChange={e => onUpdate({ ...currentFilter, max: e.target.value })} />
                </>
              ) : (
                <input placeholder="Value..." className="glass-input" style={{ width: '100%', padding: '8px' }} value={currentFilter.val || ''} onChange={e => onUpdate({ ...currentFilter, val: e.target.value })} />
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <input 
          placeholder="Find values..." 
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: '0.85rem' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <button onClick={() => onUpdate({ type: 'set', values: uniqueValues })} style={{ flex: 1, fontSize: '0.72rem', padding: '6px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', color: '#60A5FA', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Select All</button>
        <button onClick={() => onUpdate({ type: 'set', values: [] })} style={{ flex: 1, fontSize: '0.72rem', padding: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Clear All</button>
      </div>

      <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 4 }} className="custom-scrollbar">
        {filteredValues.slice(0, 100).map(v => (
          <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', background: selectedValues.includes(v) ? 'rgba(37,99,235,0.08)' : 'transparent', transition: 'background 0.2s' }}>
            <input type="checkbox" checked={selectedValues.includes(v)} onChange={() => toggleValue(v)} style={{ width: 16, height: 16, accentColor: '#2563EB' }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: selectedValues.includes(v) ? '#fff' : 'rgba(160,180,220,0.6)' }}>{v}</span>
          </label>
        ))}
        {filteredValues.length > 100 && <div style={{ textAlign: 'center', padding: '10px 0', color: 'rgba(160,180,220,0.4)', fontSize: '0.8rem' }}>Showing 100 of {filteredValues.length}</div>}
        {filteredValues.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(160,180,220,0.4)', fontSize: '0.8rem' }}>No matches found</div>}
      </div>
    </motion.div>
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
        onLoad(res.data, f.name, f);
        saveToHistory(f.name, { rows: res.data.length, cols: Object.keys(res.data[0]).length }, res.data);
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
  const { csvData, headers, fileName, loadCSV } = useDashboard();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview | insights | data
  const [filterQuery, setFilterQuery] = useState({}); // column-based filters
  const [showFilters, setShowFilters] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); 
  const [currentView, setCurrentView] = useState('default');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const dashboardRef = useRef(null);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── Analyse CSV columns ── */
  const cols = useMemo(() => 
    csvData ? classifyColumns(headers, csvData) : { numeric:[], dates:[], text:[], ids:[] },
    [csvData, headers]
  );

  const metrics = useMemo(() => cols.numeric.filter(c => !/id|key|guid|uid|index|year|zip|code|phone|lat|lon|hash/i.test(c)), [cols]);
  const labelCol = useMemo(() => cols.dates[0] || cols.text[0] || cols.ids[0] || headers[0], [cols, headers]);
  const hasMetrics = useMemo(() => metrics.length > 0, [metrics]);

  /* ── Filtered Data ── */
  const filteredData = useMemo(() => {
    if (!csvData) return [];
    const term = search.toLowerCase().trim();
    const tokens = term ? term.split(/\s+/) : [];

    // Pre-process filters outside the loop for O(1) evaluation
    const activeFilters = Object.entries(filterQuery).filter(([_, config]) => config);
    const processedFilters = activeFilters.map(([col, config]) => {
      if (config.type === 'set') {
        return { col, type: 'set', valuesSet: new Set(config.values || []) };
      }
      if (config.type === 'num') {
        const target = parseNum(config.val);
        const min = config.min !== '' ? parseNum(config.min) : -Infinity;
        const max = config.max !== '' ? parseNum(config.max) : Infinity;
        return { col, type: 'num', op: config.op, target, min, max, rawVal: config.val };
      }
      return { col, type: 'unknown' };
    });

    return csvData.filter(row => {
      // 1. Multi-token Global Search
      if (tokens.length > 0) {
        const matchesGlobal = tokens.every(token => 
          Object.values(row).some(v => String(v).toLowerCase().includes(token))
        );
        if (!matchesGlobal) return false;
      }

      // 2. Advanced Excel-like Filters
      return processedFilters.every(pf => {
        // Categorical / Set Filter
        if (pf.type === 'set') {
          if (pf.valuesSet.size === 0) return true;
          return pf.valuesSet.has(String(row[pf.col]));
        }

        // Numeric Filter
        if (pf.type === 'num') {
          if (pf.op === 'gt' || pf.op === 'lt') {
            if (pf.rawVal === '') return true;
            const val = parseNum(row[pf.col]);
            if (pf.op === 'gt') return val > pf.target;
            if (pf.op === 'lt') return val < pf.target;
          }
          if (pf.op === 'between') {
            if (pf.min === -Infinity && pf.max === Infinity) return true;
            const val = parseNum(row[pf.col]);
            return val >= pf.min && val <= pf.max;
          }
        }

        return true;
      });
    });
  }, [csvData, search, filterQuery]);

  const activeData = filteredData;
  const tableRowsData = useMemo(() => activeData.slice(0, 15), [activeData]);
  const insights = useMemo(() => activeTab === 'insights' && csvData ? getAIInsights(activeData, cols) : [], [csvData, activeData, cols, activeTab]);
  const dStats = useMemo(() => activeTab === 'insights' && csvData ? getDetailedStats(activeData, headers, cols) : {}, [csvData, activeData, headers, cols, activeTab]);
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const m1 = hasMetrics ? metrics[0] : 'Count';
  const catCol = cols.text.find(c => c !== labelCol) || cols.text[0] || cols.ids[0];

  const exportDashboard = async (format) => {
    if (!dashboardRef.current) return;
    setShowExportMenu(false);
    
    const toastId = toast.loading(`Generating ${format.toUpperCase()}...`);
    
    try {
      const target = dashboardRef.current;
      
      // html2canvas clipping fix for scrollable containers
      const canvas = await html2canvas(target, {
        scale: 2,
        backgroundColor: '#050B18',
        useCORS: true,
        logging: false,
        width: target.scrollWidth,
        height: target.scrollHeight,
        windowWidth: target.scrollWidth,
        windowHeight: target.scrollHeight,
        x: 0,
        y: 0
      });

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `autodash-report-${fileName?.replace('.csv', '') || 'export'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('PNG exported successfully!', { id: toastId });
      } else if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = canvas.width / 2;
        const pdfHeight = canvas.height / 2;
        const orientation = pdfHeight > pdfWidth ? 'portrait' : 'landscape';
        
        const pdf = new jsPDF({
          orientation: orientation,
          unit: 'px',
          format: [pdfWidth, pdfHeight]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`autodash-report-${fileName?.replace('.csv', '') || 'export'}.pdf`);
        toast.success('PDF exported successfully!', { id: toastId });
      }
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed. Please try again.', { id: toastId });
    }
  };

  /* ── Table ── */
  // Using tableRowsData from above

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050B18', color: '#F0F6FF', fontFamily: 'Inter,sans-serif', position: 'relative', overflow: 'hidden' }}>
      {/* Background Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Sidebar: hidden on mobile, shows as overlay */}
      {!isMobile && <Sidebar collapsed={collapsed} mobileOpen={false} onMobileClose={() => {}} />}
      {isMobile && <Sidebar collapsed={false} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />}

      <main style={{ flex: 1, overflowY: 'auto', height: '100vh', position: 'relative', zIndex: 1, paddingBottom: isMobile ? 72 : 0 }}>
        {/* ── Header ── */}
        <div style={{
          padding: isMobile ? '12px 16px' : '20px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: isMobile ? 10 : 16,
          background: 'rgba(5, 11, 24, 0.6)',
          position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(24px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <motion.button 
              whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => isMobile ? setMobileOpen(true) : setCollapsed(p => !p)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#60A5FA', cursor: 'pointer', padding: 8, borderRadius: 10 }}>
              <Menu size={20} />
            </motion.button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: isMobile ? '1.1rem' : '1.6rem', fontWeight: 900, margin: 0, color: '#F0F6FF', letterSpacing: '-0.02em' }}>
                  {isMobile ? `Hi, ${userName.split(' ')[0]}` : `Welcome, ${userName}`}
                </h1>
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <Sparkles size={16} color="#F59E0B" />
                </motion.div>
              </div>
              {fileName && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'rgba(160,180,220,0.55)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? 180 : 400 }}>
                📄 {fileName} · <span style={{ color: '#60A5FA' }}>{filteredData?.length} rows</span>
              </p>}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 18, flex: isMobile ? 1 : 'none', justifyContent: 'flex-end' }}>


            <div style={{ position: 'relative' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowExportMenu(!showExportMenu)}
                style={{
                  background: 'rgba(37, 99, 235, 0.15)',
                  border: '1px solid rgba(37, 99, 235, 0.3)',
                  color: '#60A5FA',
                  padding: isMobile ? '9px 12px' : '10px 18px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 700,
                  fontSize: '0.88rem'
                }}>
                <Download size={16} />
                {!isMobile && <><span>Export</span><ChevronDown size={14} style={{ transform: showExportMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} /></>}
              </motion.button>

              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    ref={exportMenuRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: 10,
                      background: 'rgba(10, 18, 40, 0.98)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 16, padding: 8, minWidth: 160,
                      boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(24px)', zIndex: 200,
                    }}
                  >
                    <motion.button
                      whileHover={{ background: 'rgba(255,255,255,0.05)' }}
                      onClick={() => exportDashboard('pdf')}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', background: 'transparent', border: 'none',
                        borderRadius: 12, color: '#F0F6FF', cursor: 'pointer', fontSize: '0.85rem'
                      }}>
                      <FilePdf size={16} color="#EF4444" />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700 }}>Export as PDF</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(160,180,220,0.5)' }}>Vectorized document</div>
                      </div>
                    </motion.button>
                    <motion.button
                      whileHover={{ background: 'rgba(255,255,255,0.05)' }}
                      onClick={() => exportDashboard('png')}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', background: 'transparent', border: 'none',
                        borderRadius: 12, color: '#F0F6FF', cursor: 'pointer', fontSize: '0.85rem'
                      }}>
                      <FilePng size={16} color="#3B82F6" />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700 }}>Export as PNG</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(160,180,220,0.5)' }}>High-res image</div>
                      </div>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile bottom nav */}
        {isMobile && <MobileBottomNav />}

        <div ref={dashboardRef} style={{ padding: isMobile ? '16px 12px' : '24px 28px' }}>
          {!csvData ? <UploadZone onLoad={loadCSV} /> : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              {/* ── Tab Switcher & Conditional Controls ── */}
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: 16, gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {activeTab === 'overview' && (
                    <>
                      <button onClick={() => setShowFilters(!showFilters)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: showFilters ? '#60A5FA' : '#fff', padding: isMobile ? '8px 12px' : '10px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600 }}>
                        <Filter size={15} /> Filters
                      </button>
                      <ViewDropdown currentView={currentView} onChange={setCurrentView} />
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        onClick={() => loadCSV(null, '')}
                        style={{
                          padding: isMobile ? '8px 12px' : '10px 18px', borderRadius: 10, background: 'rgba(37,99,235,0.15)',
                          border: '1px solid rgba(37,99,235,0.3)', color: '#60A5FA', cursor: 'pointer',
                          fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700
                        }}>
                        <RefreshCcw size={15} /> {isMobile ? 'New CSV' : 'New Data Source'}
                      </motion.button>
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

               {/* ── Active Filters Display ── */}
               {activeTab === 'overview' && Object.keys(filterQuery).length > 0 && (
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                   {Object.entries(filterQuery).map(([col, config]) => (
                     <motion.div 
                       key={col} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                       style={{ 
                         display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', 
                         background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)',
                         borderRadius: 14, fontSize: '0.85rem', color: '#60A5FA', fontWeight: 700,
                         boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                       }}
                     >
                       <span style={{ color: 'rgba(160,180,220,0.6)', fontWeight: 500 }}>{col}:</span>
                       <span>{config.type === 'set' ? `${config.values.length} Selected` : `${config.op.toUpperCase()} ${config.val || `${config.min}-${config.max}`}`}</span>
                       <button 
                         onClick={() => {
                           const next = { ...filterQuery };
                           delete next[col];
                           setFilterQuery(next);
                         }}
                         style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#F87171', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 6 }}
                       >
                         <LogOut size={12} style={{ transform: 'rotate(45deg)' }} />
                       </button>
                     </motion.div>
                   ))}
                   <button 
                     onClick={() => setFilterQuery({})}
                     style={{ background: 'rgba(255,255,255,0.03)', border: 'none', color: 'rgba(160,180,220,0.5)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, padding: '8px 16px', borderRadius: 12 }}
                   >
                     Clear all filters
                   </button>
                 </div>
               )}

               {/* ── Advanced Pill Filters ── */}
               <AnimatePresence>
                 {activeTab === 'overview' && showFilters && (
                   <motion.div 
                     initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                     style={{ overflow: 'visible', marginBottom: 24 }}
                   >
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '4px 2px 10px' }}>
                       {headers.map(h => (
                         <div key={h} style={{ position: 'relative' }}>
                           <button 
                             onClick={() => setOpenDropdown(openDropdown === h ? null : h)}
                             style={{
                               padding: '10px 18px', borderRadius: 14, whiteSpace: 'nowrap',
                               background: filterQuery[h] ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)',
                               border: filterQuery[h] ? '1px solid rgba(37,99,235,0.4)' : '1px solid rgba(255,255,255,0.06)',
                               color: filterQuery[h] ? '#60A5FA' : 'rgba(160,180,220,0.8)', cursor: 'pointer',
                               fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10,
                               transition: 'all 0.2s'
                             }}
                           >
                             {h} <ChevronDown size={14} style={{ opacity: 0.5, transform: openDropdown === h ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                           </button>
                           {openDropdown === h && (
                             <FilterDropdown 
                               column={h} data={csvData} 
                               currentFilter={filterQuery[h]}
                               onUpdate={(f) => setFilterQuery(p => ({ ...p, [h]: f }))}
                               onClose={() => setOpenDropdown(null)}
                             />
                           )}
                         </div>
                       ))}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

              {activeTab === 'overview' && (
                <>
                  <ViewEngine activeData={activeData} cols={cols} headers={headers} view={currentView} />
                </>
              )}

              {activeTab === 'insights' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  
                  {/* ── Section 1: Industry Purpose ── */}
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-card" 
                    style={{ padding: '24px 32px', borderLeft: '4px solid #60A5FA', background: 'rgba(59,130,246,0.03)' }}
                  >
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: 12, color: '#60A5FA', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Why Insights Matter</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                      {[
                        "Understand large datasets instantly",
                        "Identify critical trends & anomalies",
                        "Data-backed business decision making",
                        "Automate manual analysis workflows"
                      ].map((bullet, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'rgba(160,180,220,0.7)' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#60A5FA' }} />
                          {bullet}
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* ── Section 3: Key Metrics Cards (Top Tiles) ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    {(() => {
                      const summary = getSmartSummary(activeData, headers, cols);
                      const primaryCol = cols.numeric[0];
                      const stats = primaryCol ? getStats(activeData, primaryCol) : null;
                      
                      const tiles = [
                        { label: 'Total Rows', value: fmt(summary.rows), sub: 'Entries', icon: <LayoutDashboard size={18} />, color: '#3B82F6' },
                        { label: 'Total Columns', value: summary.cols, sub: 'Dimensions', icon: <Menu size={18} />, color: '#10B981' },
                      ];

                      if (stats) {
                        const spikes = activeData.filter(r => parseNum(r[primaryCol]) > stats.avg * 2).length;
                        const drops = activeData.filter(r => {
                          const v = parseNum(r[primaryCol]);
                          return v < stats.avg * 0.5 && v > 0;
                        }).length;

                        tiles.push(
                          { label: `Average ${primaryCol}`, value: fmt(stats.avg), sub: 'Mean', icon: <Zap size={18} />, color: '#F59E0B' },
                          { label: `Total ${primaryCol}`, value: fmt(stats.sum), sub: 'Sum', icon: <TrendingUp size={18} />, color: '#8B5CF6' },
                          { label: `Anomalies in ${primaryCol}`, value: spikes + drops, sub: 'Spikes/Drops', icon: <AlertTriangle size={18} />, color: '#EF4444' },
                          { label: `Max ${primaryCol}`, value: fmt(stats.max), sub: 'Peak', icon: <Sparkles size={18} />, color: '#EC4899' },
                        );
                      }

                      return tiles.map((tile, i) => (
                        <motion.div 
                          key={`${tile.label}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          className="glass-card" style={{ padding: '24px 20px', borderBottom: `4px solid ${tile.color}`, background: 'rgba(255,255,255,0.01)' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div style={{ padding: '10px', borderRadius: '12px', background: `${tile.color}15`, color: tile.color }}>
                              {tile.icon}
                            </div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(160,180,220,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tile.sub}</div>
                          </div>
                          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', marginBottom: 4, letterSpacing: '-0.02em' }}>{tile.value}</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(160,180,220,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tile.label}</div>
                        </motion.div>
                      ));
                    })()}
                  </div>

                  {/* ── Section 2: CSV Auto Summary (Pandas-Style describe) ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                      {(() => {
                        const summary = getSmartSummary(activeData, headers, cols);
                        return [
                          { label: 'Total Rows', val: summary.rows, icon: <LayoutDashboard size={16} /> },
                          { label: 'Total Columns', val: summary.cols, icon: <Menu size={16} /> },
                          { label: 'Numerical', val: cols.numeric.length, icon: <Zap size={16} /> },
                          { label: 'Categorical', val: cols.text.length + cols.dates.length, icon: <Filter size={16} /> }
                        ].map(stat => (
                          <div key={stat.label} className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ color: '#60A5FA' }}>{stat.icon}</div>
                            <div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{stat.val}</div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(160,180,220,0.4)', textTransform: 'uppercase' }}>{stat.label}</div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>

                    <ChartCard title="📊 Column Intelligence (Detailed Statistics)">
                      <div className="scroll-x" style={{ background: 'rgba(0,0,0,0.1)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'rgba(160,180,220,0.4)', fontWeight: 800 }}>COLUMN NAME</th>
                              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'rgba(160,180,220,0.4)', fontWeight: 800 }}>TYPE</th>
                              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'rgba(160,180,220,0.4)', fontWeight: 800 }}>MEAN / TOP</th>
                              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'rgba(160,180,220,0.4)', fontWeight: 800 }}>MEDIAN / UNIQUE</th>
                              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'rgba(160,180,220,0.4)', fontWeight: 800 }}>MIN - MAX / FREQ</th>
                              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'rgba(160,180,220,0.4)', fontWeight: 800 }}>MISSING</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              return Object.entries(dStats).slice(0, 15).map(([name, s], idx) => (
                                <tr key={name} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#fff' }}>{name}</td>
                                  <td style={{ padding: '14px 16px' }}>
                                    <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: '0.6rem', fontWeight: 900, background: s.type === 'numeric' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', color: s.type === 'numeric' ? '#60A5FA' : '#10B981', textTransform: 'uppercase' }}>
                                      {s.type}
                                    </span>
                                  </td>
                                  <td style={{ padding: '14px 16px', color: '#F0F6FF', fontWeight: 600 }}>
                                    {s.type === 'numeric' ? fmt(s.mean) : s.top}
                                  </td>
                                  <td style={{ padding: '14px 16px', color: 'rgba(160,180,220,0.8)' }}>
                                    {s.type === 'numeric' ? fmt(s.median) : `${s.unique} unique`}
                                  </td>
                                  <td style={{ padding: '14px 16px', color: 'rgba(160,180,220,0.6)' }}>
                                    {s.type === 'numeric' ? `${fmt(s.min)} - ${fmt(s.max)}` : `${s.pct}% freq`}
                                  </td>
                                  <td style={{ padding: '14px 16px', color: s.missing > 0 ? '#EF4444' : '#10B981', fontWeight: 800 }}>
                                    {s.missing > 0 ? `⚠️ ${s.missing}` : '0'}
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </ChartCard>
                  </div>

                  {/* ── Section 4-10: Intelligent AI Insights ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
                    <ChartCard title="🧠 AI Analytics Engine & Patterns">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {insights.length === 0 ? (
                          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(160,180,220,0.4)' }}>No significant insights found.</div>
                        ) : insights.map((ins, i) => (
                          <InsightItem key={i} ins={ins} index={i} />
                        ))}
                      </div>
                    </ChartCard>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <ChartCard title="🏆 Performance Spectrum">
                        <div style={{ marginBottom: 20 }}>
                          <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#10B981', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <TrendingUp size={14} /> Top 5 Categories
                          </h4>
                          {catCol && aggregateByCategory(activeData, catCol, m1).slice(0, 5).map((item, i) => (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                              <div style={{ width: 20, height: 20, borderRadius: '50%', background: PALETTE[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900, color: '#fff' }}>{i+1}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F0F6FF' }}>{item.name}</div>
                                <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 4 }}>
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / (activeData[0]?.[m1] || item.value) * 100).toFixed(0)}%` }} style={{ height: '100%', background: PALETTE[i], borderRadius: 2 }} />
                                </div>
                              </div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: PALETTE[i] }}>{fmt(item.value)}</div>
                            </div>
                          ))}
                        </div>

                        <div>
                          <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#EF4444', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <TrendingDown size={14} /> Lowest 5 Categories
                          </h4>
                          {catCol && [...aggregateByCategory(activeData, catCol, m1)].reverse().slice(0, 5).map((item, i) => (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900, color: '#EF4444' }}>{i+1}</div>
                              <div style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600, color: 'rgba(160,180,220,0.6)' }}>{item.name}</div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EF4444' }}>{fmt(item.value)}</div>
                            </div>
                          ))}
                        </div>
                      </ChartCard>

                      <ChartCard title="🔗 Metric Correlation">
                        {cols.numeric.length >= 2 ? (
                          <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#60A5FA', marginBottom: 4 }}>
                              {(getCorrelation(activeData, cols.numeric[0], cols.numeric[1]) * 100).toFixed(0)}%
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(160,180,220,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                              Strength: {cols.numeric[0]} vs {cols.numeric[1]}
                            </div>
                            <div style={{ marginTop: 16, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 10, position: 'relative' }}>
                               <motion.div 
                                initial={{ left: '50%' }}
                                animate={{ left: `${50 + (getCorrelation(activeData, cols.numeric[0], cols.numeric[1]) * 50)}%` }}
                                style={{ width: 12, height: 12, borderRadius: '50%', background: '#60A5FA', position: 'absolute', top: -4, boxShadow: '0 0 10px #3B82F6' }} 
                               />
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: 20, textAlign: 'center', color: 'rgba(160,180,220,0.4)', fontSize: '0.8rem' }}>Needs at least 2 numeric columns</div>
                        )}
                      </ChartCard>
                    </div>
                  </div>

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



            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
