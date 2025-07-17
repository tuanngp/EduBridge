/*
  # Create needs table

  1. New Tables
    - `needs`
      - `id` (uuid, primary key)
      - `school_id` (uuid, foreign key to schools)
      - `device_type` (text)
      - `quantity` (integer)
      - `description` (text)
      - `priority` (text, enum: low, medium, high, urgent)
      - `status` (text, enum: pending, approved, fulfilled)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `needs` table
    - Add policies for different user roles
*/

CREATE TABLE IF NOT EXISTS needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  device_type text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE needs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools can manage own needs"
  ON needs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM schools s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = needs.school_id
      AND u.id::text = auth.uid()::text
      AND u.role = 'school'
    )
  );

CREATE POLICY "Admins can manage all needs"
  ON needs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role = 'admin'
      AND is_verified = true
    )
  );

CREATE POLICY "Donors can read approved needs"
  ON needs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role = 'donor'
      AND is_verified = true
    )
    AND status = 'approved'
  );