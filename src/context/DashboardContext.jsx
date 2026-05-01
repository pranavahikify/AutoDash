import { createContext, useContext, useState, useEffect } from 'react';
import Papa from 'papaparse';
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
  const [rawFile, setRawFile] = useState(null);
  
  // Chat state persistence
  const [chatMessages, setChatMessages] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Fetch history from Supabase when user logs in
  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setHistory([]);
      setChatMessages([]);
      setCurrentSessionId(null);
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data.map(item => {
        // Extra defensive path resolution
        const path = item.file_path || item.filePath || item.path || 
                     item.summary?.file_path || item.summary?.filePath || item.summary?.path;
        
        return {
          id: item.id,
          name: item.name,
          summary: item.summary,
          date: item.created_at,
          rows: item.rows_count || item.rows || item.summary?.rows || 0,
          file_path: path
        };
      }));
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const loadCSV = (data, name, fileObj = null) => {
    setCsvData(data);
    setFileName(name);
    setRawFile(fileObj);
    if (data && data.length > 0) {
      const cols = Object.keys(data[0]);
      setHeaders(cols);
      setSelectedColumn(cols[0]);
      setActiveFilters({});
    }
  };

  const saveToHistory = async (name, summary, dataOverride = null) => {
    if (!user) return;
    const dataToSave = dataOverride || csvData;
    
    setIsSyncing(true);
    try {
      // 1. Upload CSV to Storage
      let filePath = null;
      if (dataToSave) {
        const fileContent = JSON.stringify(dataToSave);
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
          rows_count: summary?.rows || dataToSave?.length || 0,
          summary: { ...summary, file_path: filePath }, 
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
    const loadingToast = toast.loading(`Loading ${item.name}...`);
    // Check item root, then check if it's nested in summary
    const path = item.file_path || item.filePath || item.path || 
                 item.summary?.file_path || item.summary?.filePath || item.summary?.path;
    
    if (!path) {
      console.error('Missing path in history item:', item);
      toast.error('Data path missing in database record', { id: loadingToast });
      return false;
    }
    
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.storage
        .from('user-history')
        .download(path);

      if (error) throw error;
      const content = await data.text();
      const parsedData = JSON.parse(content);
      
      if (!Array.isArray(parsedData)) throw new Error('Invalid data format');

      setCsvData(parsedData);
      setFileName(item.name);
      
      const cols = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
      setHeaders(cols);
      setSelectedColumn(cols[0] || '');
      setActiveFilters({});
      
      const csvString = Papa.unparse(parsedData);
      const file = new File([csvString], item.name, { type: 'text/csv' });
      setRawFile(file);
      
      toast.success('Dashboard loaded', { id: loadingToast });
      return true; // Success
    } catch (error) {
      console.error('Error loading history item:', error);
      toast.error('Failed to load history data', { id: loadingToast });
      return false; // Failed
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteHistoryItem = async (item) => {
    setIsSyncing(true);
    try {
      // 1. Delete from Storage
      if (item.file_path) {
        const { error: storageError } = await supabase.storage
          .from('user-history')
          .remove([item.file_path]);
        if (storageError) console.warn('Storage delete warning:', storageError);
      }

      // 2. Delete from Database
      const { error: dbError } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', item.id);
      
      if (dbError) throw dbError;

      // 3. Update State
      setHistory(prev => prev.filter(h => h.id !== item.id));
      toast.success('Dashboard deleted from history');
    } catch (error) {
      console.error('Error deleting history item:', error);
      toast.error('Failed to delete history item');
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
      csvData, headers, fileName, history, activeFilters, selectedColumn, isSyncing, rawFile,
      chatMessages, setChatMessages, currentSessionId, setCurrentSessionId,
      loadCSV, saveToHistory, loadHistoryItem, deleteHistoryItem, getFilteredData, getInsights,
      setActiveFilters, setSelectedColumn, setRawFile
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

