INSERT INTO admin (admin_id, corporate_id, corporate_name)
VALUES
(1, 1, 'Restaurant Management Demo')
ON CONFLICT (admin_id)
DO NOTHING;
