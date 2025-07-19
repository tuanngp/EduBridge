/*
  # Create transfer_vouchers table

  1. New Tables
    - `transfer_vouchers`
      - `id` (uuid, primary key)
      - `transfer_id` (uuid, foreign key to transfers)
      - `qr_code` (text, unique identifier for QR code)
      - `status` (text, enum: active, used, expired)
      - `expiry_date` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `transfer_vouchers` table
    - Add policies for different user roles
*/

CREATE TABLE IF NOT EXISTS transfer_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  qr_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  expiry_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transfer_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can read vouchers for their transfers"
  ON transfer_vouchers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transfers t
      JOIN donors d ON d.id = t.donor_id
      JOIN users u ON u.id = d.user_id
      WHERE t.id = transfer_vouchers.transfer_id
      AND u.id::text = auth.uid()::text
      AND u.role = 'donor'
    )
  );

CREATE POLICY "Schools can read vouchers for their transfers"
  ON transfer_vouchers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transfers t
      JOIN schools s ON s.id = t.school_id
      JOIN users u ON u.id = s.user_id
      WHERE t.id = transfer_vouchers.transfer_id
      AND u.id::text = auth.uid()::text
      AND u.role = 'school'
    )
  );

CREATE POLICY "Admins can manage all vouchers"
  ON transfer_vouchers
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