/*
  # Create transfers table

  1. New Tables
    - `transfers`
      - `id` (uuid, primary key)
      - `device_id` (uuid, foreign key to devices)
      - `donor_id` (uuid, foreign key to donors)
      - `school_id` (uuid, foreign key to schools)
      - `message` (text, nullable)
      - `status` (text, enum: pending, approved, rejected, in_transit, delivered, received)
      - `notes` (text, nullable)
      - `received_images` (jsonb, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `transfers` table
    - Add policies for different user roles
*/

CREATE TABLE IF NOT EXISTS transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  donor_id uuid NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_transit', 'delivered', 'received')),
  notes text,
  received_images jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can manage transfers for their devices"
  ON transfers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM donors d
      JOIN users u ON u.id = d.user_id
      WHERE d.id = transfers.donor_id
      AND u.id::text = auth.uid()::text
      AND u.role = 'donor'
    )
  );

CREATE POLICY "Schools can manage transfers to them"
  ON transfers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM schools s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = transfers.school_id
      AND u.id::text = auth.uid()::text
      AND u.role = 'school'
    )
  );

CREATE POLICY "Admins can manage all transfers"
  ON transfers
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