import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, AlertTriangle, 
  ChevronDown, BarChart2, DollarSign, Globe, 
  Activity, Users, Package, AlertCircle 
} from 'lucide-react';
import { buildChartData, aggregateByCategory, getStats, fmt, predictNextValue, parseNum } from '../utils/csvAnalyzer';

// Constants
const PALETTE = ['#0EA5E9', '#10B981', '#6366F1', '#8B5CF6', '#F59E0B', '#EF4444', '#14B8A6', '#3B82F6'];

export const VIEW_OPTIONS = [
  { id: 'default', label: 'Default View', icon: <BarChart2 size={16} />, color: '#60A5FA' },
  { id: 'sales', label: 'Sales View', icon: <DollarSign size={16} />, color: '#10B981' },
  { id: 'market', label: 'Market View', icon: <Globe size={16} />, color: '#8B5CF6' },
  { id: 'growth', label: 'Growth View', icon: <Activity size={16} />, color: '#F59E0B' },
  { id: 'customer', label: 'Customer View', icon: <Users size={16} />, color: '#EC4899' },
  { id: 'product', label: 'Product View', icon: <Package size={16} />, color: '#14B8A6' },
  { id: 'risk', label: 'Risk / Anomaly View', icon: <AlertTriangle size={16} />, color: '#EF4444' }
];

/* ── Shared Components ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card" style={{ 
      background: 'rgba(10, 18, 40, 0.95)', border: '1px solid rgba(255,255,255,0.12)', 
      borderRadius: 16, padding: '14px 18px', fontSize: '0.88rem', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)',
      zIndex: 1000
    }}>
      <p style={{ color: 'rgba(160,180,220,0.7)', fontWeight: 600, marginBottom: 10 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#fff', fontWeight: 800, display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <span>{p.name}:</span><span>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const TrendBadge = ({ pct }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.78rem', fontWeight: 700,
    color: pct >= 0 ? '#10B981' : '#EF4444', background: pct >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: 20 }}>
    {pct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {Math.abs(pct)}%
  </span>
);

const ChartCard = ({ title, badge, children, style = {} }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass-card" style={{ padding: '24px', ...style }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#F0F6FF' }}>{title}</div>{badge}
      </div>
    </div>
    {children}
  </motion.div>
);

const StatCard = ({ label, value, trend, color = '#0EA5E9', subtext }) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card"
    style={{ padding: '24px', flex: '1 1 160px', position: 'relative', overflow: 'hidden', borderLeft: `4px solid ${color.includes('gradient') ? '#0EA5E9' : color}` }}>
    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(160,180,220,0.5)', marginBottom: 10, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#F0F6FF', marginBottom: 10 }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {trend !== undefined && <TrendBadge pct={trend} />}
      {subtext && <span style={{ fontSize: '0.75rem', color: 'rgba(160,180,220,0.6)' }}>{subtext}</span>}
    </div>
    <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 100, height: 100, background: color, filter: 'blur(50px)', opacity: 0.1, pointerEvents: 'none' }} />
  </motion.div>
);

export const ViewDropdown = ({ currentView, onChange }) => {
  const [open, setOpen] = useState(false);
  const activeOption = VIEW_OPTIONS.find(v => v.id === currentView) || VIEW_OPTIONS[0];
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button 
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 18px', borderRadius: 12,
          cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.2s',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ color: activeOption.color }}>{activeOption.icon}</div>
        <span>{activeOption.label}</span>
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.3s', color: 'rgba(255,255,255,0.5)' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: 8, width: 220, zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            {VIEW_OPTIONS.map(opt => (
              <div 
                key={opt.id} onClick={() => { onChange(opt.id); setOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  background: currentView === opt.id ? 'rgba(255,255,255,0.05)' : 'transparent', color: currentView === opt.id ? '#fff' : 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = currentView === opt.id ? 'rgba(255,255,255,0.05)' : 'transparent'}
              >
                <div style={{ color: opt.color }}>{opt.icon}</div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{opt.label}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ViewEngine({ activeData, cols, headers, view }) {
  const { numeric, text, dates } = cols;
  const labelCol = dates[0] || text[0] || headers[0];
  const catCol = text.find(c => c !== labelCol) || text[0] || headers[0];
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!activeData || activeData.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'rgba(160,180,220,0.5)', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.1)' }}>
        <AlertTriangle size={48} style={{ marginBottom: 16, opacity: 0.5, margin: '0 auto' }} />
        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 8 }}>No Data Available</h3>
        <p>No records match your current filters or data structure is empty.</p>
      </div>
    );
  }

  // Common calculations
  const m1 = numeric[0] || 'Count';

  const areaData = buildChartData(activeData, labelCol, numeric.length ? numeric : []).map(d => ({ ...d, Count: d.Count ?? 1 }));
  const barData = aggregateByCategory(activeData, catCol, numeric.length ? m1 : null).slice(0, 8);
  const st1 = numeric.length ? getStats(activeData, m1) : { sum: activeData.length, avg: 1, trend: 0 };
  
  const renderDefault = () => (
    <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* 1. Overview */}
      <div>
        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={18} color="#60A5FA" /> Overview Analysis
        </h3>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
          <StatCard label="Total Rows" value={fmt(activeData.length)} trend={0} color="#2563EB" />
          <StatCard label={`Total ${m1}`} value={fmt(st1.sum)} trend={st1.trend} color="#F59E0B" />
          <StatCard label={`Avg ${m1}`} value={fmt(st1.avg)} trend={st1.trend} color="#10B981" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
          {m1 && (
            <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
              <ChartCard title={`${m1} Performance Trend`}>
                <ResponsiveContainer width="100%" height={isMobile ? 220 : 260}>
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
                    <Area type="monotone" dataKey={m1} stroke="#60A5FA" fill="url(#glowBlue)" strokeWidth={3} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}
          {catCol && barData.length > 0 && (
            <div style={{ gridColumn: isMobile ? '1' : 'span 1' }}>
              <ChartCard title={`${catCol} Distribution`}>
                <ResponsiveContainer width="100%" height={isMobile ? 220 : 260}>
                  <PieChart>
                    <Pie data={barData} cx="50%" cy="45%" innerRadius={60} outerRadius={85} dataKey="value" stroke="none">
                      {barData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'rgba(160,180,220,0.6)', paddingTop: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
      
      {/* 2. Sales */}
      <div>
        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign size={18} color="#10B981" /> Sales & Revenue
        </h3>
        {renderSales(true)}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* 3. Market */}
      <div>
        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={18} color="#8B5CF6" /> Market & Regional Analysis
        </h3>
        {renderMarket(true)}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* 4. Growth */}
      <div>
        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={18} color="#F59E0B" /> Growth & Forecast
        </h3>
        {renderGrowth(true)}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* 5. Customer */}
      <div>
        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} color="#EC4899" /> Customer Insights
        </h3>
        {renderCustomer(true)}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* 6. Product */}
      <div>
        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={18} color="#14B8A6" /> Product Performance
        </h3>
        {renderProduct(true)}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* 7. Risk / Anomaly */}
      <div>
        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} color="#EF4444" /> Risk & Anomaly Detection
        </h3>
        {renderRisk(true)}
      </div>

    </motion.div>
  );

  const renderSales = (isEmbedded = false) => {
    const revenueCol = numeric.find(c => /revenue|sales|total|price/i.test(c)) || m1;
    const revStats = getStats(activeData, revenueCol);
    const salesData = buildChartData(activeData, dates[0] || labelCol, [revenueCol]);
    
    const content = (
      <>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
          <StatCard label="Total Revenue" value={fmt(revStats.sum)} trend={revStats.trend} color="#10B981" />
          <StatCard label="Avg Ticket Size" value={fmt(revStats.avg)} trend={revStats.trend} color="#3B82F6" />
          <StatCard label="Total Transactions" value={fmt(activeData.length)} color="#8B5CF6" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
          <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
            <ChartCard title="Revenue Timeline">
              <ResponsiveContainer width="100%" height={isMobile ? 220 : 260}>
                <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="glowGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey={revenueCol} stroke="#10B981" fill="url(#glowGreen)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <div style={{ gridColumn: isMobile ? '1' : 'span 1' }}>
            <ChartCard title="Top Selling Categories">
              <ResponsiveContainer width="100%" height={isMobile ? 220 : 260}>
                <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.8)' }} tickLine={false} axisLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {barData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      </>
    );
    return isEmbedded ? content : <motion.div key="sales" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{content}</motion.div>;
  };

  const renderMarket = (isEmbedded = false) => {
    const regionCol = text.find(c => /region|country|city|state|location|market/i.test(c)) || catCol;
    const marketData = aggregateByCategory(activeData, regionCol, m1).slice(0, 6);
    
    const content = (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 20, marginBottom: 20 }}>
        <ChartCard title="Market Share (Region)">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={marketData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" paddingAngle={5}>
                {marketData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'rgba(160,180,220,0.6)', paddingTop: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Market Penetration">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={marketData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    );
    return isEmbedded ? content : <motion.div key="market" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{content}</motion.div>;
  };

  const renderGrowth = (isEmbedded = false) => {
    const growthData = areaData.map((d, i, arr) => {
      const prev = i > 0 ? arr[i - 1][m1] : d[m1];
      const growthPct = prev ? ((d[m1] - prev) / prev) * 100 : 0;
      return { ...d, Growth: growthPct };
    });
    
    // Simple forecast calculation
    const rawVals = areaData.map(d => parseNum(d[m1]));
    const nextVal = predictNextValue(rawVals) || 0;

    const content = (
      <>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
          <StatCard label="Overall Growth Rate" value={`${fmt(st1.trend)}%`} trend={st1.trend} color="#F59E0B" />
          <StatCard label="Forecast (Next Period)" value={fmt(nextVal)} color="#EC4899" subtext={`Based on linear projection`} />
        </div>
        <ChartCard title="Period-over-Period Growth %">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={growthData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#F59E0B' }} tickLine={false} axisLine={false} tickFormatter={v => `${v.toFixed(0)}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey={m1} fill="rgba(37,99,235,0.2)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="Growth" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </>
    );
    return isEmbedded ? content : <motion.div key="growth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{content}</motion.div>;
  };

  const renderCustomer = (isEmbedded = false) => {
    const custCol = text.find(c => /customer|client|user|account/i.test(c)) || catCol;
    const segCol = text.find(c => /segment|type|tier|plan|status/i.test(c)) || text[1];
    const topCustomers = aggregateByCategory(activeData, custCol, m1).slice(0, 10);
    const segmentation = segCol ? aggregateByCategory(activeData, segCol, m1) : null;

    const content = (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 20 }}>
        <ChartCard title="Top 10 Customers">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCustomers} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#fff' }} tickLine={false} axisLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#EC4899" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {segmentation ? (
          <ChartCard title="Customer Segmentation">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={segmentation} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2} stroke="none">
                  {segmentation.map((_, i) => <Cell key={i} fill={PALETTE[(i + 3) % PALETTE.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'rgba(160,180,220,0.6)' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="New vs Repeat Activity">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'rgba(160,180,220,0.4)' }}>
              No segment column found in data to analyze returning users.
            </div>
          </ChartCard>
        )}
      </div>
    );
    return isEmbedded ? content : <motion.div key="customer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{content}</motion.div>;
  };

  const renderProduct = (isEmbedded = false) => {
    const prodCol = text.find(c => /product|item|service|plan/i.test(c)) || catCol;
    const prodData = aggregateByCategory(activeData, prodCol, m1);
    const top = prodData.slice(0, 5);
    const bottom = [...prodData].reverse().slice(0, 5);

    const content = (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 20 }}>
        <ChartCard title="Best Performing Products">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top} margin={{ top: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Worst Performing Products">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bottom} margin={{ top: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#EF4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    );
    return isEmbedded ? content : <motion.div key="product" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{content}</motion.div>;
  };

  const renderRisk = (isEmbedded = false) => {
    // Basic anomaly detection for risk view
    const vals = activeData.map(r => parseNum(r[m1])).filter(v => !isNaN(v));
    const mean = vals.reduce((a,b) => a+b, 0) / (vals.length || 1);
    const stdDev = Math.sqrt(vals.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (vals.length || 1));
    const upperLimit = mean + (2 * stdDev);
    const lowerLimit = mean - (2 * stdDev);

    const anomalyData = areaData.map(d => {
      const v = parseNum(d[m1]);
      return {
        ...d,
        val: v,
        isAnomaly: (v > upperLimit || v < lowerLimit) ? v : null,
        baseline: mean
      };
    });

    const anomaliesFound = anomalyData.filter(d => d.isAnomaly !== null).length;

    const content = (
      <>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
          <StatCard label="Anomalies Detected" value={anomaliesFound} color={anomaliesFound > 0 ? "#EF4444" : "#10B981"} />
          <StatCard label="Average Baseline" value={fmt(mean)} color="#6366F1" />
        </div>

        {anomaliesFound > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle color="#EF4444" size={24} />
            <div>
              <div style={{ fontWeight: 700, color: '#F87171' }}>Warning: Unusual Activity Detected</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>We detected {anomaliesFound} data points outside the normal distribution curve. Spikes or drops may require your attention.</div>
            </div>
          </motion.div>
        )}

        <ChartCard title="Anomaly Detection (Spikes/Drops)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={anomalyData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(160,180,220,0.5)' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="baseline" stroke="rgba(255,255,255,0.2)" strokeDasharray="5 5" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="val" stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="isAnomaly" stroke="none" dot={{ r: 6, fill: '#EF4444', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#EF4444' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </>
    );
    return isEmbedded ? content : <motion.div key="risk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{content}</motion.div>;
  };

  return (
    <AnimatePresence mode="wait">
      {view === 'sales' ? renderSales() :
       view === 'market' ? renderMarket() :
       view === 'growth' ? renderGrowth() :
       view === 'customer' ? renderCustomer() :
       view === 'product' ? renderProduct() :
       view === 'risk' ? renderRisk() :
       renderDefault()}
    </AnimatePresence>
  );
}
