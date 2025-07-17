/*
  # Create donors table

  1. New Tables
    - `donors`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `organization` (text)
      - `phone` (text)
      - `address` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `donors` table
    - Add policy for donors to read/write their own data
    - Add policy for admins to read all donors
*/

CREATE TABLE IF NOT EXISTS donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization text NOT NULL,
  phone text NOT NULL,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE donors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can manage own data"
  ON donors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = donors.user_id
      AND users.id::text = auth.uid()::text
      AND users.role = 'donor'
    )
  );

CREATE POLICY "Admins can read all donors"
  ON donors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role = 'admin'
      AND is_verified = true
    )
  );

CREATE POLICY "Schools can read verified donors"
  ON donors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      WHERE u1.id::text = auth.uid()::text
      AND u1.role = 'school'
      AND u1.is_verified = true
    )
    AND EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = donors.user_id
      AND u2.is_verified = true
    )
  );