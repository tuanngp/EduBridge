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
  )