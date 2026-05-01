import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import {
  LayoutDashboard, User, History, LogOut,
  Upload, Send, Bot, FileText, X, Sparkles, Brain, Menu, ChevronDown, Plus, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';

const N8N_WEBHOOK = 'https://nikobellic.app.n8n.cloud/webhook/ai-analysis';


/* ── Message Bubble ── */
const Bubble = ({ msg, index }) => {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      style={{ display: 'flex', gap: 12, flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isUser
          ? 'linear-gradient(135deg,#2563EB,#60A5FA)'
          : 'linear-gradient(135deg,#2563EB,#60A5FA)',
        boxShadow: isUser ? '0 4px 14px rgba(37,99,235,0.4)' : '0 4px 14px rgba(37,99,235,0.4)'
      }}>
        {isUser ? <User size={16} color="#fff" /> : <Bot size={16} color="#fff" />}
      </div>
      <div style={{
        maxWidth: '72%',
        background: isUser
          ? 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(96,165,250,0.15))'
          : 'rgba(255,255,255,0.05)',
        border: isUser ? '1px solid rgba(37,99,235,0.35)' : '1px solid rgba(255,255,255,0.09)',
        borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
        padding: '14px 18px',
        fontSize: '0.92rem', lineHeight: 1.65, color: '#E8F1FF',
        backdropFilter: 'blur(10px)',
        whiteSpace: 'pre-wrap'
      }}>
        {msg.content}
        {msg.loading && (
          <span style={{ display: 'inline-flex', gap: 4, marginLeft: 6, verticalAlign: 'middle' }}>
            {[0,1,2].map(i => (
              <motion.span key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                style={{ width: 5, height: 5, borderRadius: '50%', background: '#60A5FA', display: 'inline-block' }}
              />
            ))}
          </span>
        )}
      </div>
    </motion.div>
  );
};

/* ══ MAIN PAGE ══════════════════════════════════════════ */
export default function AIAnalysisPage() {
  const [collapsed, setCollapsed] = useState(false);
  const { rawFile: csvFile, loadCSV, saveToHistory, chatMessages: messages, setChatMessages: setMessages, currentSessionId, setCurrentSessionId } = useDashboard();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Chat History States
  const [sessions, setSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (user?.id) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (!error && data) {
      setSessions(data);
    }
  };

  const saveMessagesToSupabase = async (msgs, currentCsvName, overrideSessionId = null) => {
    if (!user?.id) return null;
    
    // Filter out loading messages
    const validMsgs = msgs.filter(m => !m.loading);

    let derivedTitle = 'New Chat';
    const firstUserMsg = validMsgs.find(m => m.role === 'user');
    if (firstUserMsg) {
      derivedTitle = firstUserMsg.content.length > 40 
        ? firstUserMsg.content.substring(0, 40) + '...'
        : firstUserMsg.content;
    }

    const activeSessionId = overrideSessionId || currentSessionId;

    if (activeSessionId) {
      const { data } = await supabase
        .from('chat_sessions')
        .update({ messages: validMsgs, updated_at: new Date(), title: derivedTitle, csv_file_name: currentCsvName })
        .eq('id', activeSessionId)
        .select()
        .single();
        
      if (data) {
        setSessions(prev => prev.map(s => s.id === data.id ? data : s));
      }
      return activeSessionId;
    } else {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ user_id: user.id, title: derivedTitle, messages: validMsgs, csv_file_name: currentCsvName })
        .select()
        .single();
      if (data) {
        setCurrentSessionId(data.id);
        setSessions(prev => {
          const filtered = prev.filter(s => s.id !== data.id);
          return [data, ...filtered];
        });
        return data.id;
      }
      return null;
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    if (csvFile) {
      setMessages([{
        role: 'assistant',
        content: `✅ **${csvFile.name}** loaded (${(csvFile.size / 1024).toFixed(1)} KB).\n\nAsk me anything about this dataset — I'll answer strictly from the data.`
      }]);
    } else {
      setMessages([]);
    }
    setShowHistory(false);
  };

  const loadSession = (session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    setShowHistory(false);
  };

  const onDrop = useCallback(files => {
    const f = files[0];
    if (!f) return;
    Papa.parse(f, {
      header: true, skipEmptyLines: true,
      complete: res => {
        if (!res.data.length) return;
        loadCSV(res.data, f.name, f);
        saveToHistory(f.name, { rows: res.data.length, cols: Object.keys(res.data[0]).length }, res.data);
        
        // Start a new chat context for this newly loaded file
        setCurrentSessionId(null);
        setMessages([{
          role: 'assistant',
          content: `✅ **${f.name}** loaded (${(f.size / 1024).toFixed(1)} KB).\n\nAsk me anything about this dataset — I'll answer strictly from the data.`
        }]);
      }
    });
  }, [loadCSV, saveToHistory]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    noClick: false
  });

  const removeFile = () => {
    loadCSV(null, '', null);
    startNewChat();
  };

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || !csvFile || loading) return;
    setInput('');
    setLoading(true);

    const userMsg = { role: 'user', content: q };
    const loadingMsg = { role: 'assistant', content: '', loading: true };
    
    // Save state instantly without loading message
    const msgsToSave = [...messages, userMsg];
    setMessages([...msgsToSave, loadingMsg]);
    
    // Create or update session immediately and get the ID
    const activeSessionId = await saveMessagesToSupabase(msgsToSave, csvFile.name);

    try {
      const form = new FormData();
      form.append('data', csvFile, csvFile.name);
      form.append('question', q);

      const res = await fetch(N8N_WEBHOOK, { method: 'POST', body: form });

      const rawText = await res.text();
      let answer = rawText; // Fallback to raw text
      
      try {
        const json = JSON.parse(rawText);
        // n8n Webhooks sometimes return an array of items if Response Mode is "Last Node"
        if (Array.isArray(json) && json.length > 0) {
          const item = json[0];
          answer = item.output || item.text || item.answer || item.message || item.response || JSON.stringify(item);
        } else if (typeof json === 'object' && json !== null) {
          answer = json.output || json.text || json.answer || json.message || json.response || JSON.stringify(json);
        }
      } catch (e) {
        // Not JSON, keep rawText
        console.log("Response was not JSON:", rawText);
      }

      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: answer };
        saveMessagesToSupabase(next, csvFile.name, activeSessionId);
        return next;
      });
    } catch (err) {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          role: 'assistant',
          content: '⚠️ Connection error. Please check that the n8n workflow is active and try again.'
        };
        saveMessagesToSupabase(next, csvFile.name, activeSessionId);
        return next;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050B18', color: '#F0F6FF', fontFamily: 'Inter,sans-serif', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'fixed', width: 600, height: 600, borderRadius: '50%', filter: 'blur(100px)', background: 'radial-gradient(circle,rgba(37,99,235,0.14) 0%,transparent 70%)', top: -200, right: -100, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', width: 400, height: 400, borderRadius: '50%', filter: 'blur(80px)', background: 'radial-gradient(circle,rgba(37,99,235,0.1) 0%,transparent 70%)', bottom: 50, left: -80, pointerEvents: 'none', zIndex: 0 }} />

      <Sidebar collapsed={collapsed} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative', zIndex: 1 }}>
        <div style={{
          padding: '18px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(5,11,24,0.7)', backdropFilter: 'blur(24px)',
          position: 'sticky', top: 0, zIndex: 40
        }}>
          {/* LEFT: Logo and Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
            <button onClick={() => setCollapsed(p => !p)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#60A5FA', cursor: 'pointer', padding: 8, borderRadius: 10 }}>
              <Menu size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#60A5FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}>
                <Brain size={18} color="#fff" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F0F6FF' }}>AI Analysis</h1>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(160,180,220,0.5)' }}>Powered by Google Gemini</p>
              </div>
            </div>
          </div>

          {/* CENTER: CSV Indicator */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <AnimatePresence>
              {csvFile && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 12 }}>
                  <FileText size={14} color="#60A5FA" />
                  <span style={{ fontSize: '0.83rem', color: '#60A5FA', fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{csvFile.name}</span>
                  <button onClick={removeFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(160,180,220,0.5)', display: 'flex', padding: 2 }}>
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: History & New Chat */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F6FF', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s' }}>
                <History size={16} color="#60A5FA" />
                History
                <ChevronDown size={14} style={{ opacity: 0.6 }} />
              </button>
              
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 260, background: '#0A1124', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 50, overflow: 'hidden' }}
                  >
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(160,180,220,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Recent Chats
                    </div>
                    <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                      {sessions.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: 'rgba(160,180,220,0.5)', fontSize: '0.8rem' }}>No history yet</div>
                      ) : (
                        sessions.map(s => {
                          const initial = s.csv_file_name ? s.csv_file_name.charAt(0).toUpperCase() : 'C';
                          return (
                          <div 
                            key={s.id}
                            onClick={() => loadSession(s)}
                            style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: currentSessionId === s.id ? 'rgba(37,99,235,0.1)' : 'transparent', transition: 'background 0.2s' }}
                          >
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: currentSessionId === s.id ? 'linear-gradient(135deg,#2563EB,#60A5FA)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', flexShrink: 0 }}>
                              {initial}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontSize: '0.85rem', color: currentSessionId === s.id ? '#60A5FA' : '#E8F1FF', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                              <div style={{ fontSize: '0.7rem', color: 'rgba(160,180,220,0.5)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.csv_file_name || 'Dataset'}</div>
                            </div>
                          </div>
                        )})
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button 
              onClick={startNewChat}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#2563EB,#60A5FA)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 4px 14px rgba(37,99,235,0.3)', transition: 'all 0.2s' }}>
              <Plus size={16} />
              New Chat
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {!csvFile && messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
              <motion.div {...getRootProps()}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                style={{
                  width: '100%', maxWidth: 480, padding: '70px 48px', textAlign: 'center',
                  background: isDragActive ? 'rgba(37,99,235,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `2px dashed ${isDragActive ? '#2563EB' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 28, cursor: 'pointer', transition: 'all 0.3s',
                  boxShadow: isDragActive ? '0 0 60px rgba(37,99,235,0.2)' : '0 20px 50px rgba(0,0,0,0.3)'
                }}>
                <input {...getInputProps()} />
                <motion.div animate={isDragActive ? { y: -12 } : { y: 0 }} transition={{ type: 'spring', stiffness: 300 }}
                  style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,#2563EB,#60A5FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 12px 36px rgba(37,99,235,0.45)' }}>
                  <Upload size={34} color="#fff" />
                </motion.div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 10, color: '#F0F6FF' }}>
                  {isDragActive ? 'Drop it here!' : 'Upload your CSV'}
                </h2>
                <p style={{ color: 'rgba(160,180,220,0.55)', fontSize: '1rem', marginBottom: 28 }}>
                  Drag & drop or click to browse · .csv only
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['Ask anything', 'AI-powered answers', 'Data-strict responses'].map(tag => (
                    <span key={tag} style={{ padding: '5px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', color: '#60A5FA' }}>{tag}</span>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => <Bubble key={i} msg={msg} index={i} />)}
                </AnimatePresence>

                {messages.length === 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', marginTop: 60 }}>
                    <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2.5 }}
                      style={{ display: 'inline-flex', marginBottom: 20 }}>
                      <Sparkles size={36} color="#60A5FA" />
                    </motion.div>
                    <p style={{ color: 'rgba(160,180,220,0.5)', fontSize: '1.05rem' }}>Ask a question about your CSV data</p>
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>

              {messages.length <= 1 && csvFile && (
                <div style={{ padding: '0 32px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['What are the column names?', 'Show me summary statistics', 'What is the highest value?', 'How many rows are there?'].map(q => (
                    <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      style={{ padding: '7px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', color: '#60A5FA', transition: 'all 0.2s' }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ padding: '16px 28px 24px', background: 'rgba(5,11,24,0.6)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', maxWidth: 860, margin: '0 auto' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder={csvFile ? "Ask anything about your CSV..." : "Please upload a CSV to start asking questions..."}
                      disabled={loading || !csvFile}
                      style={{
                        width: '100%', resize: 'none', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: '14px 18px',
                        color: '#F0F6FF', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit',
                        transition: 'border-color 0.2s, box-shadow 0.2s', lineHeight: 1.5,
                        boxShadow: input ? '0 0 0 3px rgba(37,99,235,0.15)' : 'none',
                        borderColor: input ? 'rgba(37,99,235,0.5)' : 'rgba(255,255,255,0.10)'
                      }}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                    onClick={sendMessage}
                    disabled={!input.trim() || loading || !csvFile}
                    style={{
                      width: 50, height: 50, borderRadius: 14, border: 'none', cursor: (!input.trim() || loading || !csvFile) ? 'not-allowed' : 'pointer',
                      background: (!input.trim() || loading || !csvFile) ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#2563EB,#60A5FA)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      boxShadow: (!input.trim() || loading || !csvFile) ? 'none' : '0 6px 20px rgba(37,99,235,0.5)',
                      transition: 'all 0.25s'
                    }}>
                    {loading
                      ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                          style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #60A5FA' }} />
                      : <Send size={18} color={(!input.trim() || !csvFile) ? 'rgba(160,180,220,0.3)' : '#fff'} />
                    }
                  </motion.button>
                </div>
                <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(160,180,220,0.3)', marginTop: 10 }}>
                  Press Enter to send · Shift+Enter for new line · Answers are based solely on uploaded data
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

