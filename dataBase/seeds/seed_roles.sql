INSERT INTO roles (id, role_name)
VALUES
(1, 'Corporate Administrator'),
(2, 'Regional Manager'),
(3, 'District Manager'),
(4, 'Store Manager'),
(5, 'Administrator')
ON CONFLICT (id) DO UPDATE SET role_name = EXCLUDED.role_name;

-- Ensure roles primary key sequence is correct
SELECT setval('roles_id_seq', COALESCE((SELECT MAX(id)+1 FROM roles), 1), false);