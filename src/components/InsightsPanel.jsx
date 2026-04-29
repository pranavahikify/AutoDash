import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Hash, BarChart2, Calculator, Sigma } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export default function InsightsPanel({ selectedColumn }) {
  const { getInsights, getFilteredData, headers } = useDashboard();
  const data = getFilteredData();

  const numericCols = useMemo(() =>
    headers.filter(h => {
      if (!data.length) return false;
      return data.slice(0, 10).some(r => !isNaN(parseFloat(r[h])));
    }), [headers, data]);

  const insights = useMemo(() => getInsights(selectedColumn), [selectedColumn, data]);

  if (!data.length) return null;

  const cards = [
    {
      label: 'Rows Loaded',
      value: data.length.toLocaleString(),
      icon: <Hash size={20} />,
      color: '#2563EB',
      bg: 'rgba(37,99,235,0.12)',
    },
    {
      label: 'Columns',
      value: headers.length,
      icon: <BarChart2 size={20} />,
      color: '#60A5FA',
      bg: 'rgba(96,165,250,0.12)',
    },
    ...(insights ? [
      {
        label: `Avg (${selectedColumn})`,
        value: parseFloat(insights.avg).toLocaleString(undefined, { maximumFractionDigits: 2 }),
        icon: <Calculator size={20} />,
        color: '#818CF8',
        bg: 'rgba(129,140,248,0.12)',
      },
      {
        label: `Max (${selectedColumn})`,
        value: parseFloat(insights.max).toLocaleString(),
        icon: <TrendingUp size={20} />,
        color: '#34D399',
        bg: 'rgba(52,211,153,0.12)',
      },
      {
        label: `Min (${selectedColumn})`,
        value: parseFloat(insights.min).toLocaleString(),
        icon: <TrendingDown size={20} />,
        color: '#F59E0B',
        bg: 'rgba(245,158,11,0.12)',
      },
      {
        label: `Trend`,
        value: insights.trend === 'up' ? '↑ Upward' : insights.trend === 'down' ? '↓ Downward' : '→ Stable',
        icon: insights.trend === 'up' ? <TrendingUp size={20} /> : insights.trend === 'down' ? <TrendingDown size={20} /> : <Minus size={20} />,
        color: insights.trend === 'up' ? '#34D399' : insights.trend === 'down' ? '#FC8181' : '#60A5FA',
        bg: insights.trend === 'up' ? 'rgba(52,211,153,0.12)' : insights.trend === 'down' ? 'rgba(252,129,129,0.12)' : 'rgba(96,165,250,0.12)',
      },
    ] : []),
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.4 }}
          className="glass-card pulse-glow"
          style={{
            padding: '20px',
            background: card.bg,
            border: `1px solid ${card.color}40`,
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: `${card.color}25`,
            border: `1px solid ${card.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: card.color, marginBottom: '12px',
          }}>
            {card.icon}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.02em' }}>
            {card.value}
          </div>
          <div style={{ color: 'rgba(160,180,220,0.7)', fontSize: '0.78rem', fontWeight: 500 }}>
            {card.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
