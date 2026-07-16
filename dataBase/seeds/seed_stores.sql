INSERT INTO stores
(
    district_id,
    store_code,
    store_name,
    city,
    address,
    manager_name,
    opened_on
)
VALUES

(1,'STR001','North Store 1','Hyderabad','Madhapur','Ravi Kumar','2023-01-10'),
(1,'STR002','North Store 2','Hyderabad','Gachibowli','Anil Kumar','2023-03-15'),

(2,'STR003','North Store 3','Warangal','Hanamkonda','Rahul Sharma','2023-02-11'),
(2,'STR004','North Store 4','Warangal','Kazipet','John David','2023-04-01'),

(3,'STR005','North Store 5','Karimnagar','Main Road','Suresh Rao','2023-05-08'),
(3,'STR006','North Store 6','Karimnagar','Tower Circle','Vijay Kumar','2023-06-18'),

(4,'STR007','South Store 1','Vijayawada','Benz Circle','Mahesh Babu','2023-01-05'),
(4,'STR008','South Store 2','Vijayawada','Governorpet','Kiran Kumar','2023-02-20'),

(5,'STR009','South Store 3','Guntur','Brodipet','Ramesh Naidu','2023-03-10'),
(5,'STR010','South Store 4','Guntur','Arundelpet','Sai Teja','2023-04-16'),

(6,'STR011','South Store 5','Nellore','Stonehousepet','Ajay Kumar','2023-05-12'),
(6,'STR012','South Store 6','Nellore','Magunta Layout','Hari Krishna','2023-06-25'),

(7,'STR013','East Store 1','Visakhapatnam','MVP Colony','Pavan Kumar','2023-01-08'),
(7,'STR014','East Store 2','Visakhapatnam','Dwaraka Nagar','Arjun Rao','2023-02-14'),

(8,'STR015','East Store 3','Kakinada','Sarpavaram','Lokesh Kumar','2023-03-20'),
(8,'STR016','East Store 4','Kakinada','Balaji Cheruvu','Manoj Kumar','2023-04-22'),

(9,'STR017','East Store 5','Rajahmundry','Danavaipeta','Ravi Teja','2023-05-19'),
(9,'STR018','East Store 6','Rajahmundry','Tilak Road','Vamsi Krishna','2023-06-28')

ON CONFLICT (store_code)
DO NOTHING;