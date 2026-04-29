import { createContext, useContext, useState } from 'react';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [csvData, setCsvData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [fileName, setFileName] = useState('');
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('autodash_history') || '[]');
    } catch { return []; }
  });
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedColumn, setSelectedColumn] = useState('');

  const loadCSV = (data, name) => {
    setCsvData(data);
    setFileName(name);
    if (data && data.length > 0) {
      const cols = Object.keys(data[0]);
      setHeaders(cols);
      setSelectedColumn(cols[0]);
      setActiveFilters({});
    }
  };

  const saveToHistory = (name, summary) => {
    const entry = {
      id: Date.now().toString(),
      name,
      summary,
      date: new Date().toISOString(),
      rows: csvData?.length || 0,
    };
    const updated = [entry, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('autodash_history', JSON.stringify(updated));
  };

  const getFilteredData = () => {
    if (!csvData) return [];
    return csvData.filter(row => {
      return Object.entries(activeFilters).every(([col, val]) => {
        if (!val) return true;
        return String(row[col]).toLowerCase().includes(val.toLowerCase());
      });
    });
  };

  const getInsights = (col) => {
    if (!csvData || !col) return null;
    const values = csvData.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
    if (values.length === 0) return null;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const trend = values.length > 1
      ? (values[values.length - 1] - values[0]) > 0 ? 'up' : 'down'
      : 'neutral';
    return { avg: avg.toFixed(2), max, min, trend, count: values.length, sum: sum.toFixed(2) };
  };

  return (
    <DashboardContext.Provider value={{
      csvData, headers, fileName, history, activeFilters, selectedColumn,
      loadCSV, saveToHistory, getFilteredData, getInsights,
      setActiveFilters, setSelectedColumn,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
};
