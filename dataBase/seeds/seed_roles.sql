INSERT INTO roles (role_name)
VALUES
('Admin'),
('Corporate'),
('Regional Manager'),
('District Manager'),
('Store Manager')
ON CONFLICT (role_name)
DO NOTHING;