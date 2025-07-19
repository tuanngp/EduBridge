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
  )