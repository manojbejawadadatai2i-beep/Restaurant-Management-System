INSERT INTO users (
    employee_id,
    full_name,
    email,
    password_hash,
    role_id,
    corporate_id,
    region_id,
    district_id,
    store_id
)
VALUES

-- ===========================
-- CORPORATE
-- ===========================
(
'EMP001',
'Corporate Admin',
'corporate@restaurant.com',
'$2b$12$PLACEHOLDER_HASH',
1,
1,
NULL,
NULL,
NULL
),

-- ===========================
-- REGIONAL MANAGERS
-- ===========================
(
'EMP002',
'North Region Manager',
'north.region@restaurant.com',
'$2b$12$PLACEHOLDER_HASH',
2,
1,
1,
NULL,
NULL
),

(
'EMP003',
'South Region Manager',
'south.region@restaurant.com',
'$2b$12$PLACEHOLDER_HASH',
2,
1,
2,
NULL,
NULL
),

(
'EMP004',
'East Region Manager',
'east.region@restaurant.com',
'$2b$12$PLACEHOLDER_HASH',
2,
1,
3,
NULL,
NULL
),

-- ===========================
-- DISTRICT MANAGERS
-- ===========================

('EMP005','District A Manager','district1@restaurant.com','$2b$12$PLACEHOLDER_HASH',3,1,1,1,NULL),
('EMP006','District B Manager','district2@restaurant.com','$2b$12$PLACEHOLDER_HASH',3,1,1,2,NULL),
('EMP007','District C Manager','district3@restaurant.com','$2b$12$PLACEHOLDER_HASH',3,1,1,3,NULL),

('EMP008','District D Manager','district4@restaurant.com','$2b$12$PLACEHOLDER_HASH',3,1,2,4,NULL),
('EMP009','District E Manager','district5@restaurant.com','$2b$12$PLACEHOLDER_HASH',3,1,2,5,NULL),
('EMP010','District F Manager','district6@restaurant.com','$2b$12$PLACEHOLDER_HASH',3,1,2,6,NULL),

('EMP011','District G Manager','district7@restaurant.com','$2b$12$PLACEHOLDER_HASH',3,1,3,7,NULL),
('EMP012','District H Manager','district8@restaurant.com','$2b$12$PLACEHOLDER_HASH',3,1,3,8,NULL),
('EMP013','District I Manager','district9@restaurant.com','$2b$12$PLACEHOLDER_HASH',3,1,3,9,NULL),

-- ===========================
-- STORE MANAGERS
-- ===========================

('EMP014','Store Manager 1','store1@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,1,1,1),
('EMP015','Store Manager 2','store2@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,1,1,2),

('EMP016','Store Manager 3','store3@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,1,2,3),
('EMP017','Store Manager 4','store4@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,1,2,4),

('EMP018','Store Manager 5','store5@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,1,3,5),
('EMP019','Store Manager 6','store6@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,1,3,6),

('EMP020','Store Manager 7','store7@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,2,4,7),
('EMP021','Store Manager 8','store8@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,2,4,8),

('EMP022','Store Manager 9','store9@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,2,5,9),
('EMP023','Store Manager 10','store10@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,2,5,10),

('EMP024','Store Manager 11','store11@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,2,6,11),
('EMP025','Store Manager 12','store12@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,2,6,12),

('EMP026','Store Manager 13','store13@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,3,7,13),
('EMP027','Store Manager 14','store14@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,3,7,14),

('EMP028','Store Manager 15','store15@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,3,8,15),
('EMP029','Store Manager 16','store16@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,3,8,16),

('EMP030','Store Manager 17','store17@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,3,9,17),
('EMP031','Store Manager 18','store18@restaurant.com','$2b$12$PLACEHOLDER_HASH',4,1,3,9,18)

ON CONFLICT (employee_id)
DO NOTHING;