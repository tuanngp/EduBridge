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
)