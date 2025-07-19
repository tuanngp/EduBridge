-- Create user_sessions table for refresh token management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  is_blacklisted BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add indexes for faster queries
  CONSTRAINT user_sessions_refresh_token_key UNIQUE (refresh_token)
);

-- Add index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Add index for faster lookups by expiry date (for cleanup)
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Add index for faster lookups by blacklist status
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_blacklisted ON user_sessions(is_blacklisted);

-- Add RLS policies for user_sessions table
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to see their own sessions
CREATE POLICY user_sessions_select_policy ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Only allow system to insert/update/delete sessions
CREATE POLICY user_sessions_all_policy ON user_sessions
  USING (auth.uid() IS NOT NULL);