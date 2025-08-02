// supabaseClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://xnccwydcesyvqvyqafbg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuY2N3eWRjZXN5dnF2eXFhZmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDExMTEsImV4cCI6MjA2MjM3NzExMX0.84ELOFGZFJaBNaiHM4roAVmw4o4JMEj4mHnxox1k7Gs';

// 標準設定で Supabase クライアントを生成し、セッションの保持と更新を有効化する
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

