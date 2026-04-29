import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import toast from 'react-hot-toast';

export default function CSVUploader({ onSuccess }) {
  const { loadCSV, saveToHistory } = useDashboard();
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [preview, setPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const processFile = (file) => {
    setStatus('loading');
    setErrorMsg('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setStatus('error');
          setErrorMsg('Could not parse CSV. Please check the file format.');
          return;
        }
        const data = results.data;
        setPreview({ name: file.name, rows: data.length, cols: Object.keys(data[0] || {}) });
        loadCSV(data, file.name);
        saveToHistory(file.name, { rows: data.length, cols: Object.keys(data[0] || {}).length });
        setStatus('success');
        toast.success(`Loaded ${data.length} rows from ${file.name}`);
        setTimeout(() => { if (onSuccess) onSuccess(); }, 800);
      },
      error: () => {
        setStatus('error');
        setErrorMsg('File parsing failed. Ensure it is a valid CSV.');
      },
    });
  };

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      setStatus('error');
      setErrorMsg('Only CSV files are accepted.');
      return;
    }
    if (accepted.length > 0) processFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    multiple: false,
  });

  const reset = () => {
    setStatus('idle');
    setPreview(null);
    setErrorMsg('');
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {status === 'idle' || status === 'error' ? (
          <motion.div
            key="drop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? 'rgba(37,99,235,0.8)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: '20px',
              padding: '60px 32px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragActive ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.03)',
              transition: 'all 0.3s ease',
              boxShadow: isDragActive ? '0 0 40px rgba(37,99,235,0.2)' : 'none',
            }}
          >
            <input {...getInputProps()} />
            <motion.div
              animate={{ scale: isDragActive ? 1.1 : 1, y: isDragActive ? -8 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div style={{
                width: 72, height: 72, margin: '0 auto 20px',
                background: 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(96,165,250,0.15))',
                borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(37,99,235,0.3)',
              }}>
                <Upload size={32} color="#60A5FA" />
              </div>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
                {isDragActive ? 'Drop your CSV here' : 'Drag & drop your CSV file'}
              </p>
              <p style={{ color: 'rgba(160,180,220,0.7)', fontSize: '0.9rem' }}>
                or click to browse · supports .csv files
              </p>
              {status === 'error' && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ color: '#FC8181', marginTop: '16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <AlertCircle size={15} /> {errorMsg}
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        ) : status === 'loading' ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              padding: '60px 32px', textAlign: 'center',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{
              width: 60, height: 60, margin: '0 auto 20px',
              border: '3px solid rgba(37,99,235,0.2)',
              borderTop: '3px solid #2563EB',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontWeight: 600 }}>Parsing CSV...</p>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="glass-card"
            style={{
              padding: '32px',
              background: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: 48, height: 48,
                  background: 'rgba(34,197,94,0.15)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle size={24} color="#4ADE80" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: '4px' }}>{preview?.name}</p>
                  <p style={{ color: '#60A5FA', fontSize: '0.88rem' }}>
                    {preview?.rows} rows · {preview?.cols?.length} columns
                  </p>
                </div>
              </div>
              <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(200,215,255,0.5)', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>
            {/* Column preview */}
            {preview?.cols && (
              <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {preview.cols.slice(0, 10).map(col => (
                  <span key={col} style={{
                    background: 'rgba(37,99,235,0.15)',
                    border: '1px solid rgba(37,99,235,0.25)',
                    borderRadius: '8px', padding: '4px 12px',
                    fontSize: '0.78rem', fontWeight: 500, color: '#93C5FD',
                  }}>{col}</span>
                ))}
                {preview.cols.length > 10 && (
                  <span style={{ color: 'rgba(160,180,220,0.6)', fontSize: '0.78rem', padding: '4px 8px' }}>
                    +{preview.cols.length - 10} more
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
