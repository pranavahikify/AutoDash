import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useDashboard } from '../context/DashboardContext';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#2563EB', '#60A5FA', '#818CF8', '#34D399', '#F59E0B', '#EF4444', '#EC4899', '#10B981'];

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(10,20,45,0.95)',
    border: '1px solid rgba(37,99,235,0.3)',
    borderRadius: '12px',
    color: '#F0F6FF',
    fontSize: '0.85rem',
  },
  cursor: { fill: 'rgba(37,99,235,0.08)' },
};

export default function ChartPanel({ selectedColumn }) {
  const { getFilteredData, headers } = useDashboard();
  const data = getFilteredData();

  const numericCols = useMemo(() =>
    headers.filter(h => {
      if (!data.length) return false;
      const vals = data.slice(0, 10).map(r => parseFloat(r[h]));
      return vals.some(v => !isNaN(v));
    }), [headers, data]);

  const labelCol = useMemo(() =>
    headers.find(h => !numericCols.includes(h)) || headers[0], [headers, numericCols]);

  const chartData = useMemo(() => {
    return data.slice(0, 20).map(row => {
      const entry = { name: String(row[labelCol] || '').substring(0, 15) };
      numericCols.slice(0, 4).forEach(col => {
        entry[col] = parseFloat(row[col]) || 0;
      });
      return entry;
    });
  }, [data, labelCol, numericCols]);

  const pieData = useMemo(() => {
    if (!selectedColumn) return [];
    const counts = {};
    data.forEach(row => {
      const val = String(row[selectedColumn] || 'N/A');
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [data, selectedColumn]);

  if (!data.length) return (
    <div style={{
      textAlign: 'center', padding: '60px',
      color: 'rgba(160,180,220,0.5)',
    }}>
      <BarChart2 size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
      <p>Upload a CSV to generate charts</p>
    </div>
  );

  const cards = [
    {
      title: 'Bar Chart',
      icon: <BarChart2 size={18} />,
      chart: (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: 'rgba(200,215,255,0.6)', fontSize: 11 }} angle={-25} textAnchor="end" />
            <YAxis tick={{ fill: 'rgba(200,215,255,0.6)', fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(200,215,255,0.7)' }} />
            {numericCols.slice(0, 3).map((col, i) => (
              <Bar key={col} dataKey={col} fill={COLORS[i]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: 'Line Chart',
      icon: <TrendingUp size={18} />,
      chart: (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: 'rgba(200,215,255,0.6)', fontSize: 11 }} angle={-25} textAnchor="end" />
            <YAxis tick={{ fill: 'rgba(200,215,255,0.6)', fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(200,215,255,0.7)' }} />
            {numericCols.slice(0, 3).map((col, i) => (
              <Line
                key={col} type="monotone" dataKey={col}
                stroke={COLORS[i]} strokeWidth={2.5}
                dot={{ r: 3, fill: COLORS[i] }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: 'Pie Chart',
      icon: <PieIcon size={18} />,
      chart: (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%" cy="50%"
              innerRadius={60} outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: 'rgba(255,255,255,0.3)' }}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="glass-card glow-border"
          style={{ padding: '24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{
              width: 32, height: 32,
              background: `linear-gradient(135deg, ${COLORS[i]}, ${COLORS[(i+2)%COLORS.length]})`,
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
            }}>
              {card.icon}
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{card.title}</h3>
          </div>
          {card.chart}
        </motion.div>
      ))}
    </div>
  );
}
