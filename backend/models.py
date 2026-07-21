from sqlalchemy import Column, Integer, String, Boolean, Date, Numeric, Text, ForeignKey, DateTime
from database import Base

class Role(Base):
    __tablename__ = 'roles'
    
    id = Column(Integer, primary_key=True)
    role_name = Column(String(50), nullable=False)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)


class Corporate(Base):
    __tablename__ = 'corporates'
    
    id = Column(Integer, primary_key=True)
    corporate_code = Column(String(50), nullable=False)
    corporate_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)


class Region(Base):
    __tablename__ = 'regions'
    
    id = Column(Integer, primary_key=True)
    corporate_id = Column(Integer, ForeignKey('corporates.id'), nullable=True)
    region_code = Column(String(50), nullable=False)
    region_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)


class District(Base):
    __tablename__ = 'districts'
    
    id = Column(Integer, primary_key=True)
    region_id = Column(Integer, ForeignKey('regions.id'), nullable=True)
    district_code = Column(String(50), nullable=False)
    district_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)


class Store(Base):
    __tablename__ = 'stores'
    
    id = Column(Integer, primary_key=True)
    district_id = Column(Integer, ForeignKey('districts.id'), nullable=True)
    store_code = Column(String(50), nullable=False)
    store_name = Column(String(100), nullable=False)
    city = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    manager_name = Column(String(255), nullable=True)
    opened_on = Column(Date, nullable=True)
    status = Column(String(50), nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)


class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    employee_id = Column(String(50), nullable=False)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    # Explicit login_method values: 'password_only', 'google_only', 'both'
    login_method = Column(String(50), nullable=False, default='both')
    role_id = Column(Integer, nullable=True)
    corporate_id = Column(Integer, ForeignKey('corporates.id'), nullable=True)
    region_id = Column(Integer, ForeignKey('regions.id'), nullable=True)
    district_id = Column(Integer, ForeignKey('districts.id'), nullable=True)
    store_id = Column(Integer, ForeignKey('stores.id'), nullable=True)
    is_active = Column(Boolean, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)


class CorporateKPI(Base):
    __tablename__ = 'corporate_kpis'
    
    kpi_id = Column(Integer, primary_key=True)
    corporate_id = Column(Integer, ForeignKey('corporates.id'), nullable=True)
    kpi_date = Column(Date, nullable=False)
    total_regions = Column(Integer, nullable=True)
    total_districts = Column(Integer, nullable=True)
    total_stores = Column(Integer, nullable=True)
    active_stores = Column(Integer, nullable=True)
    total_revenue = Column(Numeric(15, 2), nullable=True)
    total_orders = Column(Integer, nullable=True)
    average_order_value = Column(Numeric(10, 2), nullable=True)
    customer_count = Column(Integer, nullable=True)
    cancelled_orders = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)


class RegionKPI(Base):
    __tablename__ = 'region_kpis'
    
    kpi_id = Column(Integer, primary_key=True)
    region_id = Column(Integer, ForeignKey('regions.id'), nullable=True)
    kpi_date = Column(Date, nullable=False)
    total_districts = Column(Integer, nullable=True)
    total_stores = Column(Integer, nullable=True)
    active_stores = Column(Integer, nullable=True)
    total_revenue = Column(Numeric(15, 2), nullable=True)
    total_orders = Column(Integer, nullable=True)
    average_order_value = Column(Numeric(10, 2), nullable=True)
    customer_count = Column(Integer, nullable=True)
    cancelled_orders = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)


class DistrictKPI(Base):
    __tablename__ = 'district_kpis'
    
    kpi_id = Column(Integer, primary_key=True)
    district_id = Column(Integer, ForeignKey('districts.id'), nullable=True)
    kpi_date = Column(Date, nullable=False)
    total_stores = Column(Integer, nullable=True)
    active_stores = Column(Integer, nullable=True)
    total_revenue = Column(Numeric(15, 2), nullable=True)
    total_orders = Column(Integer, nullable=True)
    average_order_value = Column(Numeric(10, 2), nullable=True)
    customer_count = Column(Integer, nullable=True)
    cancelled_orders = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)


class KPI(Base):
    __tablename__ = 'daily_store_kpis'
    
    kpi_id = Column(Integer, primary_key=True)
    store_id = Column(Integer, ForeignKey('stores.id'), nullable=True)
    kpi_date = Column(Date, nullable=False)
    total_revenue = Column(Numeric(15, 2), nullable=True)
    total_orders = Column(Integer, nullable=True)
    average_order_value = Column(Numeric(10, 2), nullable=True)
    customer_count = Column(Integer, nullable=True)
    cancelled_orders = Column(Integer, nullable=True)
    online_orders = Column(Integer, nullable=True)
    takeaway_orders = Column(Integer, nullable=True)
    dine_in_orders = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)


class GeneratedReport(Base):
    __tablename__ = 'generated_reports'
    
    report_id = Column(Integer, primary_key=True)
    report_name = Column(String(255), nullable=False)
    report_type = Column(String(50), nullable=True)
    generated_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    corporate_id = Column(Integer, ForeignKey('corporates.id'), nullable=True)
    region_id = Column(Integer, ForeignKey('regions.id'), nullable=True)
    district_id = Column(Integer, ForeignKey('districts.id'), nullable=True)
    store_id = Column(Integer, ForeignKey('stores.id'), nullable=True)
    report_date = Column(Date, nullable=True)
    file_format = Column(String(20), nullable=True)
    file_path = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    generated_at = Column(DateTime, nullable=True)


# Alias for compatibility with the Chatbot codebase
DailyStoreKPI = KPI

class MenuItem(Base):
    __tablename__ = 'menu_items'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    price = Column(Numeric(10, 2), nullable=False)
    cost = Column(Numeric(10, 2), nullable=False)
    category = Column(String(100), nullable=False)

class Order(Base):
    __tablename__ = 'orders'
    
    id = Column(Integer, primary_key=True)
    store_id = Column(Integer, ForeignKey('stores.id'), nullable=False)
    customer_name = Column(String(100), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(50), nullable=False)
    created_at = Column(DateTime, nullable=False)

class OrderItem(Base):
    __tablename__ = 'order_items'
    
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    menu_item_id = Column(Integer, ForeignKey('menu_items.id'), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)

