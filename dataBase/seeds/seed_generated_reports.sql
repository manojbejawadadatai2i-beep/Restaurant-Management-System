INSERT INTO generated_reports
(
    report_name,
    report_type,
    generated_by,
    corporate_id,
    region_id,
    district_id,
    store_id,
    report_date,
    file_format,
    file_path,
    ai_summary
)
VALUES

(
'Daily Store Report',
'DAILY',
1,
1,
1,
1,
1,
'2026-07-11',
'PDF',
'/reports/daily_store_1.pdf',
'Revenue increased by 8% compared to yesterday.'
),

(
'Weekly District Report',
'WEEKLY',
2,
1,
1,
2,
NULL,
'2026-07-11',
'PDF',
'/reports/weekly_district_2.pdf',
'District performed above regional average.'
),

(
'Monthly Region Report',
'MONTHLY',
3,
1,
2,
NULL,
NULL,
'2026-07-11',
'EXCEL',
'/reports/monthly_region_2.xlsx',
'Region achieved the highest sales growth.'
);