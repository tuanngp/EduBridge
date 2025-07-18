import { createClient } from '@supabase/supabase-js';

import dotenv from "dotenv";
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables in supabaseClient.js');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);