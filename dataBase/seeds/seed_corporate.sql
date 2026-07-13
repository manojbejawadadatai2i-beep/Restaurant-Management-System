INSERT INTO corporates
(
    corporate_code,
    corporate_name
)
VALUES
(
    'CORP001',
    'Restaurant Management Demo'
)
ON CONFLICT (corporate_code)
DO NOTHING;