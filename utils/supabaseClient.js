// supabaseClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://xncwydeesyqvyqafbg.supabase.co';
const supabaseAnonKey = '49b00ff076eae66c4dd35832cd07a1a4f6a1632e2b887d7fbf9ce10d68db4e1d';

// 標準設定で Supabase クライアントを生成し、セッションの保持と更新を有効化する
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

