/*
  # Create schools table

  1. New Tables
    - `schools`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `school_name` (text)
      - `address` (text)
      - `phone` (text)
      - `student_count` (integer, nullable)
      - `contact_person` (text)
      - `verification_documents` (jsonb, nullable)
      - `is_verified` (boolean, default false)
      - `verified_at` (timestamp, nullable)
      - `verified_by` (uuid, nullable, foreign key to users)
      - `admin_notes` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `schools` table
    - Add policy for schools to read/write their own data
    - Add policy for admins to read all schools
*/

CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  student_count integer,
  contact_person text NOT NULL,
  verification_documents jsonb,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES users(id),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools can manage own data"
  ON schools
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = schools.user_id
      AND users.id::text = auth.uid()::text
      AND users.role = 'school'
    )
  );

CREATE POLICY "Admins can manage all schools"
  ON schools
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

CREATE POLICY "Donors can read verified schools"
  ON schools
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      WHERE u1.id::text = auth.uid()::text
      AND u1.role = 'donor'
      AND u1.is_verified = true
    )
    AND is_verified = true
  );