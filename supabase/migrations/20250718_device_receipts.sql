-- Create device_receipts table
CREATE TABLE IF NOT EXISTS device_receipts (
  id UUID PRIMARY KEY,
  transfer_id UUID NOT NULL REFERENCES transfers(id),
  device_id UUID NOT NULL REFERENCES devices(id),
  school_id UUID NOT NULL REFERENCES schools(id),
  confirmation_images TEXT[] NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT device_receipts_transfer_unique UNIQUE (transfer_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_receipts_transfer_id ON device_receipts(transfer_id);
CREATE INDEX IF NOT EXISTS idx_device_receipts_device_id ON device_receipts(device_id);
CREATE INDEX IF NOT EXISTS idx_device_receipts_school_id ON device_receipts(school_id);

-- Add RLS policies
ALTER TABLE device_receipts ENABLE ROW LEVEL SECURITY;

-- Policy for admins (full access)
CREATE POLICY admin_device_receipts_policy ON device_receipts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Policy for schools (read access to their own receipts)
CREATE POLICY school_device_receipts_read_policy ON device_receipts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM schools
      WHERE schools.id = device_receipts.school_id
      AND schools.user_id = auth.uid()
    )
  );

-- Policy for donors (read access to receipts for their devices)
CREATE POLICY donor_device_receipts_read_policy ON device_receipts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transfers
      JOIN donors ON transfers.donor_id = donors.id
      WHERE transfers.id = device_receipts.transfer_id
      AND donors.user_id = auth.uid()
    )
  );

-- Comment on table and columns
COMMENT ON TABLE device_receipts IS 'Stores confirmation receipts when schools receive devices';
COMMENT ON COLUMN device_receipts.id IS 'Unique identifier for the receipt';
COMMENT ON COLUMN device_receipts.transfer_id IS 'Reference to the transfer this receipt is for';
COMMENT ON COLUMN device_receipts.device_id IS 'Reference to the device that was received';
COMMENT ON COLUMN device_receipts.school_id IS 'Reference to the school that received the device';
COMMENT ON COLUMN device_receipts.confirmation_images IS 'Array of image URLs showing the received device';
COMMENT ON COLUMN device_receipts.notes IS 'Optional notes about the received device condition';
COMMENT ON COLUMN device_receipts.created_at IS 'Timestamp when the receipt was created';