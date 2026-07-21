import os
import sys
import bcrypt
import random
import datetime
from pathlib import Path
from sqlalchemy import text
from database import engine

def seed_db():
    print("Dropping existing tables...")
    drop_sql = """
    DROP TABLE IF EXISTS daily_store_kpis CASCADE;
    DROP TABLE IF EXISTS district_kpis CASCADE;
    DROP TABLE IF EXISTS region_kpis CASCADE;
    DROP TABLE IF EXISTS corporate_kpis CASCADE;
    DROP TABLE IF EXISTS generated_reports CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS stores CASCADE;
    DROP TABLE IF EXISTS districts CASCADE;
    DROP TABLE IF EXISTS regions CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
    DROP TABLE IF EXISTS corporates CASCADE;
    DROP TABLE IF EXISTS order_items CASCADE;
    DROP TABLE IF EXISTS orders CASCADE;
    DROP TABLE IF EXISTS menu_items CASCADE;
    """
    
    with engine.begin() as conn:
        conn.execute(text(drop_sql))
        print("Existing tables dropped successfully.")
        
        # Load and execute schema.sql
        schema_path = Path(__file__).resolve().parent.parent / "dataBase" / "schema.sql"
        print(f"Executing schema from {schema_path}...")
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_content = f.read()
            conn.execute(text(schema_content))
        print("Schema created successfully.")
        
        # 1. Seed Roles
        print("Seeding roles...")
        roles_sql = """
        INSERT INTO roles (id, role_name) VALUES
        (1, 'Corporate Administrator'),
        (2, 'Regional Manager'),
        (3, 'District Manager'),
        (4, 'Store Manager'),
        (5, 'Administrator')
        ON CONFLICT (id) DO NOTHING;
        """
        conn.execute(text(roles_sql))

        # 2. Seed Corporates
        print("Seeding 1 corporate...")
        corporate_sql = """
        INSERT INTO corporates (id, corporate_code, corporate_name) VALUES
        (1, 'CORP001', 'Ocean View Restaurant Group')
        ON CONFLICT (id) DO NOTHING;
        """
        conn.execute(text(corporate_sql))

        # 3. Seed Regions (exactly 2 regions: Andhra Pradesh and Telangana)
        print("Seeding 2 regions...")
        regions_sql = """
        INSERT INTO regions (id, corporate_id, region_code, region_name, manager_name) VALUES
        (1, 1, 'REG-AP', 'Andhra Pradesh', 'Ramesh Babu'),
        (2, 1, 'REG-TG', 'Telangana', 'Kiran Kumar')
        ON CONFLICT (id) DO NOTHING;
        """
        conn.execute(text(regions_sql))

        # 4. Seed Districts (exactly 5 districts)
        print("Seeding 5 districts...")
        districts_sql = """
        INSERT INTO districts (id, region_id, district_code, district_name, manager_name) VALUES
        (1, 1, 'DIST-VGA', 'Vijayawada District', 'Srinivas Rao'),
        (2, 1, 'DIST-VSKP', 'Visakhapatnam District', 'Anil Kumar'),
        (3, 2, 'DIST-HYD', 'Hyderabad District', 'Venkatesh Prasad'),
        (4, 1, 'DIST-GNT', 'Guntur District', 'Gopi Chand'),
        (5, 2, 'DIST-WGL', 'Warangal District', 'Rajesh Kumar')
        ON CONFLICT (id) DO NOTHING;
        """
        conn.execute(text(districts_sql))

        # 5. Seed Stores (exactly 10 stores, 2 per district)
        print("Seeding 10 stores...")
        stores_sql = """
        INSERT INTO stores (id, district_id, store_code, store_name, city, address, manager_name, opened_on, status) VALUES
        (1, 1, 'STR-VGA01', 'Ocean View Vijayawada Benz Circle', 'Vijayawada', 'Benz Circle, Vijayawada, Andhra Pradesh', 'Vijay Kumar', '2024-01-15', 'ACTIVE'),
        (2, 3, 'STR-HYD01', 'Ocean View Hyderabad Madhapur', 'Hyderabad', 'Madhapur, Hyderabad, Telangana', 'Suresh Naidu', '2024-06-20', 'ACTIVE'),
        (3, 1, 'STR-VGA02', 'Ocean View Vijayawada One Town', 'Vijayawada', 'One Town, Vijayawada, Andhra Pradesh', 'Prasad Rao', '2024-03-10', 'ACTIVE'),
        (4, 2, 'STR-VSKP01', 'Ocean View Vizag Beach Road', 'Visakhapatnam', 'Beach Road, Visakhapatnam, Andhra Pradesh', 'Ravi Shankar', '2024-02-22', 'ACTIVE'),
        (5, 2, 'STR-VSKP02', 'Ocean View Vizag Gajuwaka', 'Visakhapatnam', 'Gajuwaka, Visakhapatnam, Andhra Pradesh', 'Dharma Teja', '2024-05-18', 'ACTIVE'),
        (6, 3, 'STR-HYD02', 'Ocean View Hyderabad Gachibowli', 'Hyderabad', 'Gachibowli, Hyderabad, Telangana', 'Kalyan Ram', '2024-07-01', 'ACTIVE'),
        (7, 4, 'STR-GNT01', 'Ocean View Guntur Brodipet', 'Guntur', 'Brodipet, Guntur, Andhra Pradesh', 'Siva Prasad', '2024-04-05', 'ACTIVE'),
        (8, 4, 'STR-GNT02', 'Ocean View Guntur Arundalpet', 'Guntur', 'Arundalpet, Guntur, Andhra Pradesh', 'Narayana Murthy', '2024-06-12', 'ACTIVE'),
        (9, 5, 'STR-WGL01', 'Ocean View Warangal Hanamkonda', 'Warangal', 'Hanamkonda, Warangal, Telangana', 'Bhaskar Rao', '2024-05-25', 'ACTIVE'),
        (10, 5, 'STR-WGL02', 'Ocean View Warangal Kazipet', 'Warangal', 'Kazipet, Warangal, Telangana', 'Venkata Swamy', '2024-07-10', 'ACTIVE')
        ON CONFLICT (id) DO NOTHING;
        """
        conn.execute(text(stores_sql))

        # 6. Seed Users
        print("Hashing passwords and seeding users...")
        # Hashing password: Manoj@4462
        raw_password = "Manoj@4462"
        hashed_password = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        users_sql = """
        INSERT INTO users (id, employee_id, full_name, email, password_hash, login_method, role_id, corporate_id, region_id, district_id, store_id, is_active) VALUES
        (1, 'EMP-001', 'Mohan Krishna', 'corporate@restaurant.com', :password_hash, 'both', 1, 1, NULL, NULL, NULL, TRUE),
        (2, 'EMP-002', 'Ramesh Babu', 'region@restaurant.com', :password_hash, 'both', 2, 1, 1, NULL, NULL, TRUE),
        (3, 'EMP-003', 'Venkatesh Prasad', 'district@restaurant.com', :password_hash, 'both', 3, 1, 2, 3, NULL, TRUE),
        (4, 'EMP-004', 'Vijay Kumar', 'store1@restaurant.com', :password_hash, 'both', 4, 1, 1, 1, 1, TRUE),
        (5, 'EMP-005', 'Suresh Naidu', 'store2@restaurant.com', :password_hash, 'both', 4, 1, 2, 3, 2, TRUE),
        (8, 'EMP-008', 'User Manager Admin', 'mohankrishna.datai2i@gmail.com', :password_hash, 'both', 5, 1, NULL, NULL, NULL, TRUE)
        ON CONFLICT (id) DO NOTHING;
        """
        conn.execute(text(users_sql), {"password_hash": hashed_password})
        conn.execute(text("SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1))"))

        # 7. Seed menu_items
        print("Seeding menu_items...")
        menu_items_sql = """
        INSERT INTO menu_items (id, name, price, cost, category) VALUES 
        (1, 'Seafood Platter', 1200.00, 700.00, 'Mains'),
        (2, 'Garlic Butter Lobster', 1500.00, 900.00, 'Mains'),
        (3, 'Grilled Salmon', 850.00, 500.00, 'Mains'),
        (4, 'Clam Chowder Bowl', 350.00, 180.00, 'Soups'),
        (5, 'Crispy Calamari', 450.00, 220.00, 'Appetizers'),
        (6, 'Shrimp Cocktail', 500.00, 260.00, 'Appetizers'),
        (7, 'Caesar Salad', 300.00, 120.00, 'Salads'),
        (8, 'Fries with Truffle Mayo', 250.00, 90.00, 'Sides'),
        (9, 'Chocolate Lava Cake', 300.00, 140.00, 'Desserts'),
        (10, 'Key Lime Pie', 250.00, 110.00, 'Desserts'),
        (11, 'Fresh Coconut Water', 150.00, 40.00, 'Beverages'),
        (12, 'Ocean Blue Mocktail', 200.00, 70.00, 'Beverages')
        ON CONFLICT (id) DO NOTHING;
        """
        conn.execute(text(menu_items_sql))

        # 8. Seed orders & order_items
        print("Seeding initial orders...")
        orders_sql = """
        INSERT INTO orders (id, store_id, customer_name, total_amount, status, created_at) VALUES
        (1, 1, 'Rajesh Varma', 1200.00, 'Completed', '2026-07-10 13:00:00'),
        (2, 2, 'Priya Reddy', 450.00, 'Completed', '2026-07-10 13:00:00')
        ON CONFLICT (id) DO NOTHING;
        """
        conn.execute(text(orders_sql))
        
        order_items_sql = """
        INSERT INTO order_items (id, order_id, menu_item_id, quantity, price) VALUES
        (1, 1, 1, 1, 1200.00),
        (2, 2, 5, 1, 450.00)
        ON CONFLICT (id) DO NOTHING;
        """
        conn.execute(text(order_items_sql))

        # 9. Dynamically generate 30 days of daily KPI logs for the dashboards
        print("Generating 30 days of dashboard KPI metrics...")
        today = datetime.date.today()
        
        # Mapping relationships for easy lookups in Python
        # Store ID -> District ID
        store_to_district = {
            1: 1, 2: 3, 3: 1, 4: 2, 5: 2,
            6: 3, 7: 4, 8: 4, 9: 5, 10: 5
        }
        # District ID -> Region ID
        district_to_region = {
            1: 1, 2: 1, 3: 2, 4: 1, 5: 2
        }
        
        region_ids = [1, 2]
        district_ids = [1, 2, 3, 4, 5]
        store_ids = list(range(1, 11))
        
        for d in range(30):
            kpi_date = today - datetime.timedelta(days=d)
            
            # Initializations for the day
            dist_data = {d_id: {
                "rev": 0.0, "orders": 0, "cust": 0, "canc": 0, "total_stores": 0, "active_stores": 0
            } for d_id in district_ids}
            
            reg_data = {r_id: {
                "rev": 0.0, "orders": 0, "cust": 0, "canc": 0, "total_stores": 0, "active_stores": 0, "total_districts": 0
            } for r_id in region_ids}
            
            corp_data = {
                "rev": 0.0, "exp": 0.0, "orders": 0, "cust": 0, "canc": 0, "total_stores": 0, "active_stores": 0, "total_regions": 2, "total_districts": 5
            }
            
            # Count districts per region and stores per district/region
            for s_id in store_ids:
                d_id = store_to_district[s_id]
                dist_data[d_id]["total_stores"] += 1
                dist_data[d_id]["active_stores"] += 1
                
                r_id = district_to_region[d_id]
                reg_data[r_id]["total_stores"] += 1
                reg_data[r_id]["active_stores"] += 1
                
                corp_data["total_stores"] += 1
                corp_data["active_stores"] += 1
                
            for d_id in district_ids:
                r_id = district_to_region[d_id]
                reg_data[r_id]["total_districts"] += 1

            # Generate individual store metrics and accumulate
            for s_id in store_ids:
                rev = float(random.randint(3000, 7000))
                exp = float(random.randint(1200, 3000))
                orders = random.randint(60, 120)
                aov = round(rev / orders, 2) if orders > 0 else 0.0
                cust = int(orders * random.uniform(1.3, 1.6))
                canc = random.randint(1, 5)
                online = int(orders * random.uniform(0.3, 0.45))
                takeaway = int(orders * random.uniform(0.25, 0.35))
                dinein = orders - online - takeaway
                
                conn.execute(text("""
                    INSERT INTO daily_store_kpis (store_id, kpi_date, total_revenue, today_expenses, total_orders, average_order_value, customer_count, cancelled_orders, online_orders, takeaway_orders, dine_in_orders)
                    VALUES (:store_id, :kpi_date, :rev, :exp, :orders, :aov, :cust, :canc, :online, :takeaway, :dinein)
                    ON CONFLICT (store_id, kpi_date) DO UPDATE SET
                        total_revenue = EXCLUDED.total_revenue,
                        today_expenses = EXCLUDED.today_expenses,
                        total_orders = EXCLUDED.total_orders,
                        average_order_value = EXCLUDED.average_order_value,
                        customer_count = EXCLUDED.customer_count,
                        cancelled_orders = EXCLUDED.cancelled_orders,
                        online_orders = EXCLUDED.online_orders,
                        takeaway_orders = EXCLUDED.takeaway_orders,
                        dine_in_orders = EXCLUDED.dine_in_orders;
                """), {
                    "store_id": s_id, "kpi_date": kpi_date, "rev": rev, "exp": exp, "orders": orders, "aov": aov,
                    "cust": cust, "canc": canc, "online": online, "takeaway": takeaway, "dinein": dinein
                })
                
                d_id = store_to_district[s_id]
                dist_data[d_id]["rev"] += rev
                dist_data[d_id]["orders"] += orders
                dist_data[d_id]["cust"] += cust
                dist_data[d_id]["canc"] += canc
                
                corp_data["exp"] += exp

            # Calculate and insert District KPIs
            for d_id in district_ids:
                d_rev = dist_data[d_id]["rev"]
                d_orders = dist_data[d_id]["orders"]
                d_cust = dist_data[d_id]["cust"]
                d_canc = dist_data[d_id]["canc"]
                d_aov = round(d_rev / d_orders, 2) if d_orders > 0 else 0.0
                d_total = dist_data[d_id]["total_stores"]
                d_active = dist_data[d_id]["active_stores"]
                
                conn.execute(text("""
                    INSERT INTO district_kpis (district_id, kpi_date, total_stores, active_stores, total_revenue, total_orders, average_order_value, customer_count, cancelled_orders)
                    VALUES (:district_id, :kpi_date, :total_stores, :active_stores, :total_revenue, :total_orders, :average_order_value, :customer_count, :cancelled_orders)
                    ON CONFLICT (district_id, kpi_date) DO UPDATE SET
                        total_stores = EXCLUDED.total_stores,
                        active_stores = EXCLUDED.active_stores,
                        total_revenue = EXCLUDED.total_revenue,
                        total_orders = EXCLUDED.total_orders,
                        average_order_value = EXCLUDED.average_order_value,
                        customer_count = EXCLUDED.customer_count,
                        cancelled_orders = EXCLUDED.cancelled_orders;
                """), {
                    "district_id": d_id, "kpi_date": kpi_date, "total_stores": d_total, "active_stores": d_active,
                    "total_revenue": d_rev, "total_orders": d_orders, "average_order_value": d_aov, "customer_count": d_cust, "cancelled_orders": d_canc
                })
                
                r_id = district_to_region[d_id]
                reg_data[r_id]["rev"] += d_rev
                reg_data[r_id]["orders"] += d_orders
                reg_data[r_id]["cust"] += d_cust
                reg_data[r_id]["canc"] += d_canc

            # Calculate and insert Region KPIs
            for r_id in region_ids:
                r_rev = reg_data[r_id]["rev"]
                r_orders = reg_data[r_id]["orders"]
                r_cust = reg_data[r_id]["cust"]
                r_canc = reg_data[r_id]["canc"]
                r_aov = round(r_rev / r_orders, 2) if r_orders > 0 else 0.0
                r_districts = reg_data[r_id]["total_districts"]
                r_total_stores = reg_data[r_id]["total_stores"]
                r_active_stores = reg_data[r_id]["active_stores"]
                
                conn.execute(text("""
                    INSERT INTO region_kpis (region_id, kpi_date, total_districts, total_stores, active_stores, total_revenue, total_orders, average_order_value, customer_count, cancelled_orders)
                    VALUES (:region_id, :kpi_date, :total_districts, :total_stores, :active_stores, :total_revenue, :total_orders, :average_order_value, :customer_count, :cancelled_orders)
                    ON CONFLICT (region_id, kpi_date) DO UPDATE SET
                        total_districts = EXCLUDED.total_districts,
                        total_stores = EXCLUDED.total_stores,
                        active_stores = EXCLUDED.active_stores,
                        total_revenue = EXCLUDED.total_revenue,
                        total_orders = EXCLUDED.total_orders,
                        average_order_value = EXCLUDED.average_order_value,
                        customer_count = EXCLUDED.customer_count,
                        cancelled_orders = EXCLUDED.cancelled_orders;
                """), {
                    "region_id": r_id, "kpi_date": kpi_date, "total_districts": r_districts, "total_stores": r_total_stores, "active_stores": r_active_stores,
                    "total_revenue": r_rev, "total_orders": r_orders, "average_order_value": r_aov, "customer_count": r_cust, "cancelled_orders": r_canc
                })
                
                corp_data["rev"] += r_rev
                corp_data["orders"] += r_orders
                corp_data["cust"] += r_cust
                corp_data["canc"] += r_canc

            # Calculate and insert Corporate KPIs
            c_rev = corp_data["rev"]
            c_exp = corp_data["exp"]
            c_orders = corp_data["orders"]
            c_cust = corp_data["cust"]
            c_canc = corp_data["canc"]
            c_aov = round(c_rev / c_orders, 2) if c_orders > 0 else 0.0
            
            conn.execute(text("""
                INSERT INTO corporate_kpis (corporate_id, kpi_date, total_regions, total_districts, total_stores, active_stores, total_revenue, total_expenses, total_orders, average_order_value, customer_count, cancelled_orders)
                VALUES (1, :kpi_date, :total_regions, :total_districts, :total_stores, :active_stores, :total_revenue, :total_expenses, :total_orders, :average_order_value, :customer_count, :cancelled_orders)
                ON CONFLICT (corporate_id, kpi_date) DO UPDATE SET
                    total_regions = EXCLUDED.total_regions,
                    total_districts = EXCLUDED.total_districts,
                    total_stores = EXCLUDED.total_stores,
                    active_stores = EXCLUDED.active_stores,
                    total_revenue = EXCLUDED.total_revenue,
                    total_expenses = EXCLUDED.total_expenses,
                    total_orders = EXCLUDED.total_orders,
                    average_order_value = EXCLUDED.average_order_value,
                    customer_count = EXCLUDED.customer_count,
                    cancelled_orders = EXCLUDED.cancelled_orders;
            """), {
                "kpi_date": kpi_date, "total_regions": corp_data["total_regions"], "total_districts": corp_data["total_districts"],
                "total_stores": corp_data["total_stores"], "active_stores": corp_data["active_stores"], "total_revenue": c_rev,
                "total_expenses": c_exp, "total_orders": c_orders, "average_order_value": c_aov, "customer_count": c_cust, "cancelled_orders": c_canc
            })

        # Adjust sequences
        conn.execute(text("SELECT setval('menu_items_id_seq', COALESCE((SELECT MAX(id)+1 FROM menu_items), 1), false);"))
        conn.execute(text("SELECT setval('orders_id_seq', COALESCE((SELECT MAX(id)+1 FROM orders), 1), false);"))
        conn.execute(text("SELECT setval('order_items_id_seq', COALESCE((SELECT MAX(id)+1 FROM order_items), 1), false);"))
        conn.execute(text("SELECT setval('users_id_seq', COALESCE((SELECT MAX(id)+1 FROM users), 1), false);"))
        conn.execute(text("SELECT setval('stores_id_seq', COALESCE((SELECT MAX(id)+1 FROM stores), 1), false);"))
        conn.execute(text("SELECT setval('districts_id_seq', COALESCE((SELECT MAX(id)+1 FROM districts), 1), false);"))
        conn.execute(text("SELECT setval('regions_id_seq', COALESCE((SELECT MAX(id)+1 FROM regions), 1), false);"))
        conn.execute(text("SELECT setval('corporates_id_seq', COALESCE((SELECT MAX(id)+1 FROM corporates), 1), false);"))

        print("Seeding completed successfully!")

if __name__ == "__main__":
    seed_db()
