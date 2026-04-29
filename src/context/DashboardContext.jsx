import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const { user } = useAuth();
  const [csvData, setCsvData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [fileName, setFileName] = useState('');
  const [history, setHistory] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedColumn, setSelectedColumn] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch history from Supabase when user logs in
  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data.map(item => ({
        id: item.id,
        name: item.name,
        summary: item.summary,
        date: item.created_at,
        rows: item.rows_count,
        file_path: item.file_path
      })));
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

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

  const saveToHistory = async (name, summary) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      // 1. Upload CSV to Storage (Optional but recommended for "everything should load")
      let filePath = null;
      if (csvData) {
        const fileContent = JSON.stringify(csvData);
        const fileNameInStorage = `${user.id}/${Date.now()}-${name}.json`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-history')
          .upload(fileNameInStorage, fileContent);
        
        if (uploadError) throw uploadError;
        filePath = uploadData.path;
      }

      // 2. Save metadata to Database
      const { data, error } = await supabase
        .from('dashboards')
        .insert({
          user_id: user.id,
          name,
          rows_count: csvData?.length || 0,
          summary,
          file_path: filePath
        })
        .select()
        .single();

      if (error) throw error;

      const entry = {
        id: data.id,
        name,
        summary,
        date: data.created_at,
        rows: data.rows_count,
        file_path: filePath
      };
      
      setHistory(prev => [entry, ...prev].slice(0, 20));
    } catch (error) {
      console.error('Error saving to history:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadHistoryItem = async (item) => {
    if (!item.file_path) return;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.storage
        .from('user-history')
        .download(item.file_path);

      if (error) throw error;
      const content = await data.text();
      const parsedData = JSON.parse(content);
      
      setCsvData(parsedData);
      setFileName(item.name);
      if (parsedData.length > 0) {
        const cols = Object.keys(parsedData[0]);
        setHeaders(cols);
        setSelectedColumn(cols[0]);
        setActiveFilters({});
      }
    } catch (error) {
      console.error('Error loading history item:', error);
      toast.error('Failed to load history data');
    } finally {
      setIsSyncing(false);
    }
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
      csvData, headers, fileName, history, activeFilters, selectedColumn, isSyncing,
      loadCSV, saveToHistory, loadHistoryItem, getFilteredData, getInsights,
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
