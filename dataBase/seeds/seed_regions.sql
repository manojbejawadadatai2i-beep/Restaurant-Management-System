INSERT INTO regions
(
    corporate_id,
    region_code,
    region_name
)
VALUES

(1,'REG001','Region1'),
(1,'REG002','Region2'),
(1,'REG003','Region3')

ON CONFLICT(region_code)
DO NOTHING;