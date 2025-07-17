/*
  # Create devices table

  1. New Tables
    - `devices`
      - `id` (uuid, primary key)
      - `donor_id` (uuid, foreign key to donors)
      - `name` (text)
      - `description` (text)
      - `device_type` (text)
      - `condition` (text, enum: new, used-good, used-fair)
      - `quantity` (integer)
      - `images` (jsonb, array of image URLs)
      - `status` (text, enum: pending, approved, rejected, matched, completed)
      - `admin_notes` (text, nullable)
      - `reviewed_at` (timestamp, nullable)
      - `reviewed_by` (uuid, nullable, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `devices` table
    - Add policies for different user roles
*/

CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  device_type text NOT NULL,
  condition text NOT NULL CHECK (condition IN ('new', 'used-good', 'used-fair')),
  quantity integer NOT NULL DEFAULT 1,
  images jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'matched', 'completed')),
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can manage own devices"
  ON devices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM donors d
      JOIN users u ON u.id = d.user_id
      WHERE d.id = devices.donor_id
      AND u.id::text = auth.uid()::text
      AND u.role = 'donor'
    )
  );

CREATE POLICY "Admins can manage all devices"
  ON devices
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

CREATE POLICY "Schools can read approved devices"
  ON devices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role = 'school'
      AND is_verified = true
    )
    AND status = 'approved'
  );