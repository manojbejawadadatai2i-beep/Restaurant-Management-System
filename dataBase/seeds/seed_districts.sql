INSERT INTO districts
(
    region_id,
    district_code,
    district_name
)
VALUES

(1,'DIST001','District A'),
(1,'DIST002','District B'),
(1,'DIST003','District C'),

(2,'DIST004','District D'),
(2,'DIST005','District E'),
(2,'DIST006','District F'),

(3,'DIST007','District G'),
(3,'DIST008','District H'),
(3,'DIST009','District I')

ON CONFLICT (district_code)
DO NOTHING;