INSERT INTO districts (region_id, district_code, district_name, manager_name)
VALUES
(1, 'DIST001', 'District A', 'District A Manager'),
(1, 'DIST002', 'District B', 'District B Manager'),
(1, 'DIST003', 'District C', 'District C Manager'),
(2, 'DIST004', 'District D', 'District D Manager'),
(2, 'DIST005', 'District E', 'District E Manager'),
(2, 'DIST006', 'District F', 'District F Manager'),
(3, 'DIST007', 'District G', 'District G Manager'),
(3, 'DIST008', 'District H', 'District H Manager'),
(3, 'DIST009', 'District I', 'District I Manager')
ON CONFLICT (district_code)
DO NOTHING;
