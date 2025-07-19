import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://riybtuhsfbsevxnwmfxp.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeWJ0dWhzZmJzZXZ4bndtZnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NTY1MjAsImV4cCI6MjA2ODMzMjUyMH0.GzX5KImbYEZDlp8pc_4NQFeMGVYP6MTlWaTLdMQIuSc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);