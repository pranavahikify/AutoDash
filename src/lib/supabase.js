import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase credentials missing. The application will not function correctly. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
}

// We initialize with whatever we have. If they are empty, createClient will throw, 
// so we wrap it in a try-catch to allow the app to at least render a UI (though it will fail on data calls).
let supabaseInstance;
try {
  if (!supabaseUrl || !supabaseAnonKey) {
    // If missing, we export a proxy that logs errors instead of crashing the whole app load
    supabaseInstance = new Proxy({}, {
      get: () => () => {
        console.error('Supabase called but not initialized. Check environment variables.');
        return { data: null, error: { message: 'Supabase not initialized' } };
      }
    });
  } else {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (err) {
  console.error('Failed to initialize Supabase client:', err);
}

export const supabase = supabaseInstance;
