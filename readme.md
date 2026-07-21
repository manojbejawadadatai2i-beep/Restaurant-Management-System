# Ocean View Restaurant Management System - End-to-End Technical Documentation

Welcome to the **Ocean View Restaurant Management System** technical documentation. This guide details the backend and database architecture, security constraints, database flows, and the end-to-end operation of the platform.

---

## 1. Directory & File Structure

The project is split into a **FastAPI** backend and a **React/TypeScript** frontend.

```text
Restaurant-Management-System/
├── database/                   # Database scripts and schemas
│   ├── schema.sql              # Consolidated PostgreSQL schema (tables, constraints, indices)
│   └── seeds/                  # Initial seeding files
│
├── backend/                    # Python Backend
│   ├── Api/                    # REST Endpoint Routers (FastAPI)
│   │   ├── auth.py             # User authentication and token validation
│   │   ├── chat.py             # LLM Text-to-SQL query bridge & session endpoints
│   │   ├── dashboard.py        # Scoped dashboard analytics
│   │   ├── reports.py          # PDF/CSV/Excel sales reports
│   │   └── users.py            # User management CRUD
│   │
│   ├── Services/               # Core Business Logic Layer
│   │   ├── chatbot_service.py  # Coordinates the chatbot state machine
│   │   ├── dashboard_service.py# Dashboard RBAC resolver & KPI aggregations
│   │   ├── llm_service.py      # LLM Prompt construction & Groq API client
│   │   ├── rbac_service.py     # SQL validation, blocklisting, and user scoping rules
│   │   ├── report_service.py   # Report exports compiler
│   │   └── user_service.py     # Password hashing and DB synchronization
│   │
│   ├── Repositories/           # Data Access Layer (SQLAlchemy ORM + Raw queries)
│   │   ├── dashboard_repository.py # Complex aggregated DB queries for dashboards
│   │   ├── user_repository.py  # User-specific query operations
│   │   └── sql_executor.py     # Safe execution of dynamic read-only SQL
│   │
│   ├── test/                   # Python Unit & Integration Tests
│   │   ├── test_chatbot_flow.py# Integration test for chatbot DB access
│   │   ├── test_dashboard.py   # RBAC & scoping boundaries test cases
│   │   ├── test_reports.py     # Reporting endpoint schemas validation
│   │   └── test_users.py       # CRUD & auth flow tests
│   │
│   ├── models.py               # SQLAlchemy ORM declarations
│   ├── schemas.py              # Pydantic validation schemas
│   ├── database.py             # DB connection pool initialization & dependency yield
│   ├── security.py             # JWT generation and parsing utilities
│   └── main.py                 # FastAPI Application entry point
│
└── frontend/                   # React + TypeScript Frontend
```

---

## 2. Architecture & Design Patterns

The backend follows a classic **API-Service-Repository** layered architecture:

```mermaid
graph TD
    Client[React Frontend] <--> API[API Routers]
    API <--> Service[Service Layer]
    Service <--> Repo[Repository Layer]
    Repo <--> DB[(PostgreSQL DB)]
    Service <--> LLM[LLM / Groq API]
```

### Layer Separation
* **FastAPI Routers (`Api/`)**: Express API routing paths, ingest parameters, and define HTTP responses. They do not write queries or contain business logic.
* **Services (`Services/`)**: Place where decisions are made. They validate rules, check permissions, handle caching, and coordinate external services (like Groq LLM API).
* **Repositories (`Repositories/`)**: Interface with the database. They construct SQLAlchemy ORM queries or execute parameterized raw SQL.

---

## 3. Database Architecture & Hierarchical Scopes

The database runs on **PostgreSQL**. The schema represents a multi-location hierarchy designed to support fine-grained data isolation.

### A. The Organizational Hierarchy
```mermaid
graph TD
    Corporate[Corporates] --> Region[Regions]
    Region --> District[Districts]
    District --> Store[Stores]
    Store --> User[Users / Staff]
```
Users are bound to a specific node in this hierarchy:
* **Corporate Admins**: Can view all stores and perform CRUD across any entity.
* **Region Managers**: Restricted to data within their assigned `region_id`.
* **District Managers**: Restricted to data within their assigned `district_id`.
* **Store Managers**: Restricted to data within their assigned `store_id`.

### B. Pre-computed Analytical KPI Snapshots
To ensure sub-100ms dashboard loads, the system avoids running heavy aggregates over millions of raw transactions. Instead, we use pre-computed daily KPI tables:
* **`daily_store_kpis`**: Stores store-level daily figures (revenue, expenses, customer count, online/takeaway/dine-in order counts).
* **`district_kpis`**: Roll-up statistics for districts.
* **`region_kpis`**: Roll-up statistics for regions.
* **`corporate_kpis`**: Global corporate-wide roll-up statistics.

### C. Operational Tables
* **`menu_items`**: Menu catalog (name, category, price, and raw cost).
* **`orders`**: Customer transactions detailing total amounts and order statuses.
* **`order_items`**: Pivot table mapping items to orders (quantity, sale price).

---

## 4. The Text-to-SQL Chatbot Pipeline & Security

The most critical database flow is the **Natural Language to SQL pipeline**, allowing managers to ask questions (e.g. *"Show today's revenue in district 3"*) and receive answers summarized by AI.

### End-to-End Chat Flow
1. **User Input**: A user sends a natural language question through `/chat/query`.
2. **Context Assembly**: The `ChatbotService` fetches the conversation history from memory and resolves the active user's hierarchical scope (e.g., `store_id = 2`).
3. **SQL Generation**: The `llm_service` sends the DB schema, the question, and mandatory scoping constraints (e.g., `"MANDATORY ACCESS FILTER: You MUST include store_id = :store_id"`) to the LLM (via Groq API).
4. **Safety & Sandboxing Validation**: The query passes through the `RBACService` validator:
   - **Blocklist Check**: Rejects any queries containing modification words (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, etc.).
   - **Single-Statement Check**: Ensures no semicolons `;` exist, preventing multi-statement injection.
   - **Scope Check**: For scoped roles, verifies that the query contains the mandatory parameter filter (e.g., `store_id = :store_id`).
5. **Database Execution**: The sandbox executes the query with:
   - **Statement Timeout**: Injects `statement_timeout` (e.g., 5000ms) dynamically to prevent locking threads.
   - **Row Limit**: Constrains returns to a maximum of 200 records.
6. **AI Summary**: The raw SQL results are passed back to the LLM to write a natural language response.

---

## 5. Security & Verification Tests

The platform features an automated test suite located in `backend/test/` to safeguard features and security policies:

1. **`test_chatbot_flow.py` (Integration / E2E)**:
   - Validates that the Text-to-SQL chatbot fetches actual database records.
   - Mocks the LLM calls and executes the query against real seeded data to assert that columns and row mappings match the expected structures.
2. **`test_dashboard.py` (Authorization Scope Tests)**:
   - Creates temporary Region, District, and Store Managers in the DB.
   - Triggers the `/api/dashboard` endpoint and asserts that requesting data outside their assigned scopes returns a **`403 Forbidden`** error with descriptive messages.
3. **`test_reports.py` (Reporting API Tests)**:
   - Verifies the reports generation APIs (`sales-by-store`, `sales-by-category`, and `orders list`) to ensure responses match schema formats.
4. **`test_users.py` (CRUD Tests)**:
   - Validates user provisioning flows (create, update, delete) and ensures that critical admins (User ID 1) cannot be deleted.

---

## 6. How to Run & Verify

### Pre-requisites
* Python 3.10+
* PostgreSQL Database
* A Groq API Key

### Installation
1. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Configure environmental variables in `backend/.env`:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5402/restaurant_db
   GROQ_API_KEY=gsk_your_key_here
   GROQ_MODEL=llama3-8b-8192
   ```
3. Initialize the database and run seeds:
   ```bash
   python backend/seed_db.py
   ```
4. Start the backend:
   ```bash
   uvicorn backend.main:app --reload
   ```

### Running Tests
Execute the tests directly with Python's unittest module or pytest:
```bash
python -m unittest discover -s backend/test
```
or
```bash
python backend/test/test_chatbot_flow.py
python backend/test/test_dashboard.py
```
