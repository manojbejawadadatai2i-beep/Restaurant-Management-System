INSERT INTO regions (corporate_id, region_code, region_name, manager_name)
VALUES
(1, 'REG001', 'Region1', 'North Region Manager'),
(1, 'REG002', 'Region2', 'South Region Manager'),
(1, 'REG003', 'Region3', 'East Region Manager')
ON CONFLICT (region_code)
DO NOTHING;
