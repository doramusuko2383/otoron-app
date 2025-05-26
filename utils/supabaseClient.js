// supabaseClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://flnqyramgddjcbbaispx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsbnF5cmFtZ2RkamNiYmFpc3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjEwMDcsImV4cCI6MjA2MzgzNzAwN30.ARtrCplVHw7Q0gdDjsaoHp6__CNulye_IMWIqFmacqc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

