# Ocean View Restaurant Management Portal - System Documentation & Slide Presentation Guide

---

## Table of Contents
1. [Executive Summary & System Architecture](#1-executive-summary--system-architecture)
2. [Master AI Prompt for Slide Deck Generation](#2-master-ai-prompt-for-slide-deck-generation)
3. [Slide-by-Slide Deck Outline (12 Slides)](#3-slide-by-slide-deck-outline-12-slides)
4. [Database Schema & Table Relationships](#4-database-schema--table-relationships)
5. [Authentication & Login Mechanism](#5-authentication--login-mechanism)
6. [Role-Based Access Control (RBAC) & Data Scoping](#6-role-based-access-control-rbac--data-scoping)
7. [Cascading KPI Aggregation Pipeline](#7-cascading-kpi-aggregation-pipeline)
8. [AI Insights Generation Logic](#8-ai-insights-generation-logic)
9. [LLM Chatbot Architecture & Connection Pipeline](#9-llm-chatbot-architecture--connection-pipeline)
10. [Session Memory Service](#10-session-memory-service)
11. [Chatbot Guardrails & Security Controls](#11-chatbot-guardrails--security-controls)
12. [End-to-End User Flow](#12-end-to-end-user-flow)

---

## 1. Executive Summary & System Architecture

The **Ocean View Restaurant Management Portal** is an enterprise-grade multi-tenant analytics, reporting, and operational intelligence decision-support platform designed for restaurant chains.

```
                    ┌────────────────────────────────────────────────────────┐
                    │               React + Vite Frontend                    │
                    │   (Dashboard, KPIs, AI Insights, Chatbot, Reports)     │
                    └───────────────────────────┬────────────────────────────┘
                                                │ REST API / JWT Bearer
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │                 FastAPI Backend Service                │
                    │  (auth.py, dashboard.py, insights.py, chat.py, etc.)   │
                    └───────┬───────────────────┬───────────────────┬────────┘
                            │                   │                   │
                            ▼                   ▼                   ▼
           ┌──────────────────────┐  ┌────────────────────┐  ┌───────────────┐
           │ PostgreSQL Database  │  │ Groq Cloud LLM API │  │ Memory        │
           │ (Hierarchical KPIs,  │  │ (llama-3.3-70b-    │  │ Service       │
           │ Users, Stores, Orders│  │  versatile)        │  │ (In-Memory    │
           └──────────────────────┘  └────────────────────┘  │  Thread-Safe) │
                                                             └───────────────┘
```

### Core Capabilities
* **Hierarchical Organizational Scoping**: Corporate $\rightarrow$ Region $\rightarrow$ District $\rightarrow$ Store architecture.
* **Cascading Real-Time KPI Aggregation**: Automated multi-tier SQL pipeline aggregating daily store performance metrics up through corporate totals.
* **AI-Powered Business Insights Engine**: Contextual financial and operational analysis producing executive summaries, alerts, root-cause explanations, and actionable recommendations.
* **Text-to-SQL Analytics Chatbot**: Conversational AI interface transforming natural language queries into scope-constrained PostgreSQL queries.
* **Multi-Layered Security & Guardrails**: Regex-based SQL injection prevention, mandatory scope parameter binding, strict read-only query enforcement, and out-of-domain detection.
* **Flexible Authentication**: Dual login options via traditional bcrypt password hash verification and Google OAuth 2.0 token verification.

---

## 2. Master AI Prompt for Slide Deck Generation

> **Instructions for the User**: Copy and paste the prompt block below into **Gamma.app**, **Tome.app**, **ChatGPT (with Slides/Vibe plugin)**, **Marp**, or **Microsoft Copilot** to instantly generate a presentation.

```text
Create a modern, professional, 12-slide dark-theme presentation on the topic: "Ocean View Restaurant Management Portal - Technical Architecture, AI Insights & Security Engine".

Use clean typography, high visual contrast (dark navy background, emerald green accents, white text), process flow diagrams, key metrics callouts, and clean technical bullet points. Avoid filler text.

Slide Breakdown to Generate:
- Slide 1: Title Slide - Ocean View Restaurant Management Portal (Enterprise Analytics & AI Decision Support)
- Slide 2: Architectural Overview & Tech Stack (React + Vite, FastAPI, PostgreSQL, Groq LLM)
- Slide 3: Enterprise Database Schema & Hierarchical Relationships (Corporate > Region > District > Store)
- Slide 4: Cascading Multi-Tier KPI Aggregation Pipeline (Store-level to Corporate rollup)
- Slide 5: Authentication Architecture (Password Hashing & Google OAuth 2.0 Integration)
- Slide 6: Role-Based Access Control (RBAC) & Row-Level Data Scoping
- Slide 7: AI Insights Engine (Pydantic Payload, LLM JSON Structuring & Fallback System)
- Slide 8: Conversational Text-to-SQL Chatbot Pipeline (2-Stage Prompting Engine)
- Slide 9: LLM Integration & Session Memory Service (Thread-safe history tracking)
- Slide 10: Multi-Layered Chatbot Security Guardrails (AST/Regex validation, mandatory scope binding)
- Slide 11: End-to-End User Experience & Navigation Journey
- Slide 12: Enterprise Security, Reliability & Strategic Roadmap

Content Details to Include:
Highlight how LLMs generate SQL securely, how strict RBAC scopes prevent data leaks across stores, how cascading SQL views maintain single-source-of-truth KPIs, and how fallbacks maintain 99.9% uptime even during LLM API timeouts.
```

---

## 3. Slide-by-Slide Deck Outline (12 Slides)

### Slide 1: Title & Executive Summary
* **Header**: Ocean View Restaurant Management Portal
* **Subtitle**: Enterprise Operational Analytics, Multi-Tier RBAC & AI-Powered Decision Support
* **Key Visual**: Dashboard Mockup / System Topology Diagram
* **Bullets**:
  * Unified operational intelligence across Corporate, Regional, District, and Store tiers.
  * Real-time financial analytics: Revenue, Orders, AOV, Cancellation Rates, Net Margins.
  * Natural language data querying driven by Groq `llama-3.3-70b-versatile`.
* **Speaker Notes**: Introduce the portal as a multi-tenant decision-support system built to aggregate raw store data into actionable executive insights while enforcing strict data scoping across organizational tiers.

---

### Slide 2: Tech Stack & System Architecture
* **Header**: System Architecture & Technology Stack
* **Visual**: Clean 3-Tier Architecture Diagram (Frontend $\rightarrow$ Backend API $\rightarrow$ Database & LLM)
* **Components**:
  * **Frontend**: React 18, Vite, TypeScript, Lucide Icons, Recharts, Tailwind CSS.
  * **Backend**: FastAPI (Python 3.10+), Pydantic v2, SQLAlchemy ORM, PyJWT, bcrypt.
  * **Database**: PostgreSQL with indexing, cascading foreign keys, and atomic upsert triggers.
  * **AI Service**: Groq API (`llama-3.3-70b-versatile`) with sub-second inference.
* **Speaker Notes**: Highlight the decoupled architecture. FastAPI delivers low-latency async REST endpoints, React ensures responsive visual management, and PostgreSQL holds structured financial metrics.

---

### Slide 3: Database Schema & Entity Relationships
* **Header**: Database Schema & Organizational Topology
* **Visual**: Entity-Relationship Diagram (ERD) mapping primary and foreign keys.
* **Core Entities**:
  * `corporates` $\rightarrow$ `regions` $\rightarrow$ `districts` $\rightarrow$ `stores` (1:N Hierarchy)
  * `users` linked via foreign keys to `roles`, `corporates`, `regions`, `districts`, `stores`
  * `daily_store_kpis` $\rightarrow$ `district_kpis` $\rightarrow$ `region_kpis` $\rightarrow$ `corporate_kpis`
  * Operational tables: `menu_items`, `orders`, `order_items`, `generated_reports`
* **Speaker Notes**: Explain how organizational scope is encoded directly into relational foreign keys, allowing effortless scope inheritance and fast aggregated joins.

---

### Slide 4: Multi-Tier Cascading KPI Pipeline
* **Header**: Automated Multi-Tier KPI Aggregation Pipeline
* **Visual**: Cascading Pyramid (Store $\rightarrow$ District $\rightarrow$ Region $\rightarrow$ Corporate)
* **Aggregation Logic**:
  * **Level 0**: Base daily operational metrics recorded in `daily_store_kpis`.
  * **Level 1**: District rollup summarizing total stores, active stores, revenue, orders, AOV, cancellations.
  * **Level 2**: Region rollup summing district metrics per date.
  * **Level 3**: Corporate rollup calculating overall chain metrics and net expenses (58% standard ratio).
  * **Upsert Guard**: `ON CONFLICT (scope_id, kpi_date) DO UPDATE` ensures idempotency.
* **Speaker Notes**: Emphasize that reports and dashboard views read pre-computed aggregated tables for sub-50ms responses rather than calculating raw order sums on the fly.

---

### Slide 5: Authentication & Login Flow
* **Header**: Enterprise Authentication Architecture
* **Visual**: Dual Authentication Flow (Password Hash & Google OAuth 2.0)
* **Key Mechanics**:
  * **Standard Login**: Email + Password lookup, bcrypt password verification, plaintext fallback for legacy imports.
  * **Google OAuth**: Verification of Google `id_token` via `google.oauth2.id_token`.
  * **Token Generation**: Custom JWT signed with `HS256` containing `user_id`, `role`, and assigned scope IDs (`store_id`, `district_id`, `region_id`).
  * **Security Handling**: Automatic password reset check for default initial credentials (`name@123`).
* **Speaker Notes**: Explain how JWT payload embedding eliminates database re-fetches for permission verification on every incoming request.

---

### Slide 6: RBAC & Row-Level Data Scoping
* **Header**: Role-Based Access Control (RBAC) & Data Scoping
* **Visual**: Permission Matrix Table by Role
* **Role Scopes**:
  * **Corporate Admin**: Unrestricted global scope (`scope_column = None`). Access to all stores.
  * **Regional Manager**: Filtered to `region_id = :region_id`.
  * **District Manager**: Filtered to `district_id = :district_id`.
  * **Store Manager / Employee**: Strict store-level access `store_id = :store_id`.
* **Enforcement Mechanism**:
  * `RBACService.get_scope_for_user()` extracts assigned scope from JWT claims and injects bound SQL parameters into runtime database sessions.
* **Speaker Notes**: Detail how multi-tenancy is enforced. A Store Manager can never query or view performance metrics outside their assigned store.

---

### Slide 7: AI Insights Generation Engine
* **Header**: AI-Powered Business Insights Engine
* **Visual**: Input Metrics JSON $\rightarrow$ Groq LLM $\rightarrow$ Formatted Structured Response UI
* **Operational Flow**:
  1. Frontend posts KPI metric summary to `/generate-insights`.
  2. `LLMService.generate_insights()` formats system prompt enforcing strict JSON structure.
  3. LLM evaluates 5 operational dimensions: Executive Summary, Key Insights, Operational Alerts, Root Cause Analysis, Actionable Recommendations.
  4. Deterministic local fallback generator runs automatically if LLM service times out.
* **Speaker Notes**: Highlight resilience: even during network degradation, users receive accurate algorithmic fallback insights based on cancellation threshold formulas.

---

### Slide 8: Conversational Text-to-SQL Chatbot Pipeline
* **Header**: Conversational Text-to-SQL Engine
* **Visual**: 2-Stage Pipeline Diagram (Question $\rightarrow$ SQL Gen $\rightarrow$ Exec $\rightarrow$ NL Summary)
* **Pipeline Breakdown**:
  * **Stage 1 (SQL Generation)**: Prompt combines Database Schema, Mandatory Scope Rule, Conversation History, and User Question to produce safe PostgreSQL query.
  * **Stage 2 (SQL Execution)**: Query validated and executed via SQLAlchemy engine against read-only transaction context.
  * **Stage 3 (Natural Language Answer)**: Query result table fed to LLM to produce a concise human-readable summary.
* **Speaker Notes**: Explain that the user gets instant human answers without ever seeing raw SQL, technical table names, or raw JSON structures.

---

### Slide 9: LLM Connection & Memory Management
* **Header**: LLM Connection & Session Memory Service
* **Visual**: Memory Buffer Diagram (`collections.deque` with Thread Lock)
* **Technical Details**:
  * **LLM Engine**: Groq Client SDK communicating with `llama-3.3-70b-versatile` model.
  * **Temperature Setting**: Low temperature (`0.2`) ensures strict deterministic SQL & metric formatting.
  * **Memory Isolation**: Thread-safe `MemoryService` maintains per-session conversation queues (`deque(maxlen=20)`).
  * **Context Injection**: Passes last 6 conversation turns into Text-to-SQL prompt for seamless multi-turn dialog.
* **Speaker Notes**: Point out how conversational continuity ("What about yesterday?") works because the LLM receives past Q&A context.

---

### Slide 10: Multi-Layered Chatbot Guardrails
* **Header**: Multi-Layered AI & SQL Guardrails
* **Visual**: 5-Tier Security Filter Stack
* **Security Rules**:
  1. **Read-Only Enforcer**: Regex matching `FORBIDDEN_SQL` blocks `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`.
  2. **Injection Defense**: Rejects queries with semicolons (`;`), inline comments (`--`), or multi-line comment blocks (`/*`).
  3. **Mandatory Scope Binding**: Verifies that SQL string explicitly contains `:scope_column` parameter reference.
  4. **Domain Scope Guard**: Prompts tagged with `NOT_RESTAURANT_RELATED` return standard refusal.
  5. **Single Source of Truth**: System prompt forces joins against `daily_store_kpis` table.
* **Speaker Notes**: Emphasize that LLM outputs are never trusted implicitly—every generated query undergoes runtime regex and parameter inspection before execution.

---

### Slide 11: End-to-End User Experience Flow
* **Header**: End-to-End User Journey
* **Visual**: User Step Flow Diagram (Login $\rightarrow$ Scope Selection $\rightarrow$ Insights $\rightarrow$ Chatbot $\rightarrow$ Export)
* **User Step Flow**:
  1. **Authenticate**: User logs in via Password or Google OAuth; JWT saved to `localStorage`.
  2. **Dashboard View**: Overview cards populate with Revenue, Orders, AOV, and Cancellation rates based on user role.
  3. **AI Insights**: User clicks "Generate Insights" to view tailored business analysis.
  4. **Conversational Query**: User asks "Which item generated highest revenue this month?" in AI Chatbot.
  5. **Exporting Reports**: User downloads filtered performance summaries in PDF or Excel formats.
* **Speaker Notes**: Walk the audience through a real scenario of a Regional Manager auditing low-performing stores in their assigned district.

---

### Slide 12: Security, Compliance & System Roadmap
* **Header**: System Strengths & Strategic Roadmap
* **Visual**: Roadmap Timeline (Current Features $\rightarrow$ Future Innovations)
* **Current Strengths**:
  * Sub-100ms API response times for pre-aggregated KPIs.
  * Zero SQL injection vectors via bound parameter validation.
  * Deterministic fallback guarantees UI continuity.
* **Future Innovations**:
  * Vector embeddings (RAG) for restaurant SOPs & recipe document search.
  * Predictive forecasting for inventory waste and peak staffing.
  * Automated push alerts for high cancellation spikes via WhatsApp / Email.
* **Speaker Notes**: Conclude by reiterating that Ocean View combines traditional relational database strength with state-of-the-art AI speed and security.

---

## 4. Database Schema & Table Relationships

The database is built on **PostgreSQL** using SQLAlchemy ORM.

### Entity Relationship Mapping

```
[corporates] (1) <─── (N) [regions] (1) <─── (N) [districts] (1) <─── (N) [stores]
     │                       │                      │                     │
     ├─── (N) [users]        ├─── (N) [users]       ├─── (N) [users]      ├─── (N) [users]
     │                       │                      │                     │
     └─── (N) [corp_kpis]    └─── (N) [region_kpis] └─── (N) [district_kpis]└─── (N) [daily_store_kpis]
                                                                                  │
                                                                                  └─── (1) <─── (N) [orders] <─── (N) [order_items] ───> (1) [menu_items]
```

### Table Definitions & Key Columns

| Table Name | Primary Key | Foreign Keys | Key Attributes & Purpose |
| :--- | :--- | :--- | :--- |
| `roles` | `id` | None | Defines system roles: Corporate Admin, Regional Manager, District Manager, Store Manager, Employee. |
| `corporates` | `id` | None | Top-level corporate entity (`corporate_code`, `corporate_name`). |
| `regions` | `id` | `corporate_id` $\rightarrow$ `corporates.id` | Regional geographic grouping (`region_code`, `region_name`). |
| `districts` | `id` | `region_id` $\rightarrow$ `regions.id` | District organizational subunit (`district_code`, `district_name`). |
| `stores` | `id` | `district_id` $\rightarrow$ `districts.id` | Physical restaurant store (`store_code`, `store_name`, `city`, `status`). |
| `scopes` | `id` | `parent_scope_id`, `region_id`, `district_id`, `store_id` | Universal hierarchy lookup table (`scope_name`, `scope_type`). |
| `users` | `id` | `role_id`, `corporate_id`, `region_id`, `district_id`, `store_id` | System user credentials (`email`, `password_hash`, `login_method`, `employee_id`). |
| `daily_store_kpis` | `kpi_id` | `store_id` $\rightarrow$ `stores.id` | Store-level daily metrics (`total_revenue`, `total_orders`, `average_order_value`, `customer_count`, `cancelled_orders`). |
| `district_kpis` | `kpi_id` | `district_id` $\rightarrow$ `districts.id` | District daily rolled-up metrics (`total_stores`, `active_stores`, `total_revenue`, `total_orders`). |
| `region_kpis` | `kpi_id` | `region_id` $\rightarrow$ `regions.id` | Region daily rolled-up metrics (`total_districts`, `total_stores`, `total_revenue`). |
| `corporate_kpis` | `kpi_id` | `corporate_id` $\rightarrow$ `corporates.id` | Chain-wide daily rolled-up metrics (`total_expenses`, `total_revenue`, `total_orders`). |
| `menu_items` | `id` | None | Food & beverage items (`name`, `price`, `cost`, `category`). |
| `orders` | `id` | `store_id` $\rightarrow$ `stores.id` | Customer orders (`customer_name`, `total_amount`, `status`, `created_at`). |
| `order_items` | `id` | `order_id`, `menu_item_id` | Order line items (`quantity`, `price`). |
| `generated_reports` | `report_id` | `generated_by`, scope IDs | Metadata for generated PDF/Excel reports (`file_path`, `ai_summary`). |

---

## 5. Authentication & Login Mechanism

The system supports a dual authentication pipeline via FastAPI ([auth.py](file:///c:/Users/maddi/OneDrive/Desktop/DataI2I/Restaurant-Management-System/backend/Api/auth.py)).

```
                  ┌──────────────────────────────────────────────┐
                  │          Incoming Login Request              │
                  └──────────────────────┬───────────────────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
            [/login (Email + Password)]     [/login/google (Google ID Token)]
                         │                               │
             Query `users` by email            Verify Token via Google API
                         │                               │
            Check Password via bcrypt           Extract Email & Query `users`
                         │                               │
                         └───────────────┬───────────────┘
                                         │
                                         ▼
                        Fetch User Role & Organizational Scope
                                         │
                                         ▼
                         Generate Signed JWT Access Token
                         (Signed with HMAC-SHA256 Secret)
```

### 1. Password Authentication (`POST /login`)
1. Accepts `email` and `password`.
2. Queries `users` table for matching email record.
3. Checks password using `bcrypt.checkpw(password, stored_hash)`. If legacy unhashed data exists, falls back to direct string match.
4. Reads user role from `roles` table and resolves scope hierarchy (`corporate_id`, `region_id`, `district_id`, `store_id`).
5. Returns a standard OAuth2 Bearer JWT token.

### 2. Google OAuth Login (`POST /login/google`)
1. Accepts Google `id_token` string sent from frontend Google Sign-In SDK.
2. Verifies token signature and audience using `google.oauth2.id_token.verify_oauth2_token()`.
3. Extracts authenticated user `email`.
4. Verifies user exists in the `users` table and issues identical JWT claims.

### 3. JWT Claims Structure
```json
{
  "user_id": "emp_14",
  "sub": "emp_14",
  "role": "store manager",
  "corporate_id": 1,
  "region_id": 2,
  "district_id": 5,
  "store_id": 12,
  "employee_id": "EMP-014",
  "email": "manager.store12@oceanview.com",
  "exp": 1721800000
}
```

---

## 6. Role-Based Access Control (RBAC) & Data Scoping

Data scoping is governed by `RBACService` ([rbac_service.py](file:///c:/Users/maddi/OneDrive/Desktop/DataI2I/Restaurant-Management-System/backend/Services/rbac_service.py)).

### Scoping Matrix

```python
class RBACService:
    @staticmethod
    def get_scope_for_user(user: AuthenticatedUser) -> tuple[str | None, dict[str, int]]:
        role = user.role.strip().lower()
        if "corporate" in role or "admin" in role:
            return None, {}
        
        if "region" in role:
            scope_column = "region_id"
        elif "district" in role:
            scope_column = "district_id"
        elif "store" in role:
            scope_column = "store_id"
        else:
            scope_column = None
            
        value = getattr(user, scope_column, None)
        return scope_column, {scope_column: value}
```

### Hierarchy Permissions

| Role | Scope Column | Dynamic SQL Filter Applied | Accessible Data Boundary |
| :--- | :--- | :--- | :--- |
| **Corporate Admin** | `None` | Unrestricted (No `WHERE` filter injected) | Complete organizational chain |
| **Regional Manager** | `region_id` | `WHERE region_id = :region_id` | Stores & Districts within assigned Region |
| **District Manager** | `district_id` | `WHERE district_id = :district_id` | Stores within assigned District |
| **Store Manager** | `store_id` | `WHERE store_id = :store_id` | Assigned Store metrics only |

---

## 7. Cascading KPI Aggregation Pipeline

To deliver instant dashboard rendering without performing heavy on-the-fly SQL aggregations over millions of order rows, the system features an automated **4-Tier Cascading Aggregation Pipeline** ([kpi_service.py](file:///c:/Users/maddi/OneDrive/Desktop/DataI2I/Restaurant-Management-System/backend/Services/kpi_service.py)).

```
                       ┌───────────────────────────────┐
                       │       daily_store_kpis        │  (Store-level daily stats)
                       └───────────────┬───────────────┘
                                       │ Group by district_id, kpi_date
                                       ▼
                       ┌───────────────────────────────┐
                       │         district_kpis         │  (District-level totals)
                       └───────────────┬───────────────┘
                                       │ Group by region_id, kpi_date
                                       ▼
                       ┌───────────────────────────────┐
                       │          region_kpis          │  (Region-level totals)
                       └───────────────┬───────────────┘
                                       │ Group by corporate_id, kpi_date
                                       ▼
                       ┌───────────────────────────────┐
                       │        corporate_kpis         │  (Global Chain metrics)
                       └───────────────────────────────┘
```

### Key Execution Highlights
1. **Atomic Upserts**: Uses PostgreSQL `ON CONFLICT (scope_id, kpi_date) DO UPDATE` to ensure non-duplication during backfills or updates.
2. **Dynamic Expense Ratio**: Corporate-level expenses are automatically estimated at $58\%$ of total gross revenue (`total_expenses = ROUND(SUM(total_revenue) * 0.58, 2)`).
3. **AOV Computation**: Average Order Value is computed dynamically:
   $$\text{AOV} = \frac{\sum \text{total\_revenue}}{\sum \text{total\_orders}}$$

---

## 8. AI Insights Generation Logic

The AI Insights Engine transforms numeric KPI dictionaries into executive narrative summaries ([insights.py](file:///c:/Users/maddi/OneDrive/Desktop/DataI2I/Restaurant-Management-System/backend/Api/insights.py) & [llm_service.py](file:///c:/Users/maddi/OneDrive/Desktop/DataI2I/Restaurant-Management-System/backend/Services/llm_service.py)).

### 1. Payload Definition (`InsightsRequest`)
```json
{
  "scope_name": "District 3 - North Region",
  "total_revenue": 145200.00,
  "total_orders": 3200,
  "average_order_value": 45.37,
  "customer_count": 2950,
  "cancelled_orders": 112,
  "total_expenses": 84216.00
}
```

### 2. System Prompt Enforcement (`INSIGHTS_SYSTEM_PROMPT`)
Instructs the Groq LLM to act as a senior business analytics advisor and produce a strict 5-field JSON response:
* `executive_summary`: 2-sentence executive summary of revenue, orders, and profit margins.
* `key_business_insights`: Analysis of AOV, menu performance, customer acquisition.
* `alerts`: Operational alerts for cancellation spikes or cost thresholds.
* `possible_reasons`: Root cause analysis of peak windows and cost structures.
* `business_recommendations`: 3 actionable business strategies.

### 3. Resilience & Fallback Engine
If the LLM call fails, times out, or produces malformed JSON, the service executes a deterministic fallback generator:
```python
rate = round((canc / orders * 100), 1) if orders > 0 else 0
margin = round(((rev - exp) / rev * 100)) if rev > 0 else 0

return {
    "executive_summary": f"Overall performance for {scope} remains strong with total revenue reaching ₹{rev:,.2f} across {orders:,} orders. Net profit margin is holding steady at {margin}%.",
    "key_business_insights": f"Average Order Value (AOV) stands at ₹{aov:,.2f} with an active customer base of {cust:,} customers.",
    "alerts": f"Order cancellation rate is at {rate}% ({canc} orders) for {scope}." if rate > 4 else f"Order cancellation rate is controlled at a healthy {rate}%.",
    "possible_reasons": "Peak sales density is observed during lunch (1 PM - 3 PM) and dinner service windows.",
    "business_recommendations": "1. Promote combo meal bundles during off-peak hours.\n2. Streamline kitchen preparation workflows.\n3. Optimize inventory ordering."
}
```

---

## 9. LLM Chatbot Architecture & Connection Pipeline

The Conversational Chatbot translates plain English into safe PostgreSQL queries and converts raw query results into clear human responses ([chatbot_service.py](file:///c:/Users/maddi/OneDrive/Desktop/DataI2I/Restaurant-Management-System/backend/Services/chatbot_service.py)).

```
[User Question] ──> [Chatbot Service] ──> [LLM Stage 1: Text-to-SQL]
                                                   │
                                                   ▼
[Formatted Answer] <── [LLM Stage 2: Summary] <── [SQL Validation & Exec]
```

### End-to-End Execution Breakdown

```python
def process_query(self, question: str, user: AuthenticatedUser, session_id: Optional[str] = None) -> dict:
    session_key = session_id or f"user_{user.user_id}"
    
    # 1. Retrieve session history
    history = memory_service.get_history(session_key, 20)
    
    # 2. Extract RBAC scope
    scope_column, params = RBACService.get_scope_for_user(user)
    
    # 3. Generate raw SQL with Groq LLM
    sql = llm_service.generate_sql(question, user, history)
    
    # 4. Handle out-of-domain queries
    if "NOT_RESTAURANT_RELATED" in sql:
        return {"answer": "I can only answer questions regarding Ocean View operations.", "sql": "N/A"}
        
    # 5. Validate SQL safety and RBAC scope constraint
    valid_sql = RBACService.validate_read_only_sql(sql, scope_column)
    
    # 6. Execute SQL query against DB
    result, duration = execute_sql(valid_sql, params)
    
    # 7. Generate Natural Language summary answer
    answer = llm_service.generate_answer(question, result)
    
    # 8. Persist interaction into session memory
    memory_service.append_interaction(session_key, question, answer)
    
    return {"sql": valid_sql, "answer": answer, "rows_returned": len(result.get("rows", []))}
```

---

## 10. Session Memory Service

Conversational history is managed in-memory via `MemoryService` ([memory_service.py](file:///c:/Users/maddi/OneDrive/Desktop/DataI2I/Restaurant-Management-System/backend/Services/memory_service.py)).

### Technical Implementation Features
* **Thread Safety**: Wrapped with Python `threading.Lock()` to prevent race conditions during concurrent chat requests.
* **Rolling Buffer**: Uses Python `collections.deque(maxlen=20)` to maintain a rolling window of the last 20 interactions.
* **Context Injection**: Passes the last 6 turns into `generate_sql()` so the LLM understands follow-up questions (e.g., *"What about yesterday?"* or *"Show top 5 menu items for that store"*).

---

## 11. Chatbot Guardrails & Security Controls

To ensure zero risk of data destruction, SQL injection, or un-scoped data leaks, the chatbot implements **5 Guardrail Layers**:

```
                  ┌──────────────────────────────────────────────┐
                  │             Generated LLM Query              │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
            ┌──────────────────────────────────────────────────────────┐
            │ Layer 1: Domain Relevance Check                          │
            │ Tagged 'NOT_RESTAURANT_RELATED' -> Immediate Refusal     │
            └────────────────────────────┬─────────────────────────────┘
                                         │ Passed
                                         ▼
            ┌──────────────────────────────────────────────────────────┐
            │ Layer 2: Single Statement & Read-Only Regex Check        │
            │ Must start with SELECT or WITH; no semicolons / comments │
            └────────────────────────────┬─────────────────────────────┘
                                         │ Passed
                                         ▼
            ┌──────────────────────────────────────────────────────────┐
            │ Layer 3: Forbidden DDL/DML Keyword Regex Filter          │
            │ Blocks INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE...  │
            └────────────────────────────┬─────────────────────────────┘
                                         │ Passed
                                         ▼
            ┌──────────────────────────────────────────────────────────┐
            │ Layer 4: Mandatory RBAC Scope Binding Verification       │
            │ Query MUST contain `:scope_column` bind parameter        │
            └────────────────────────────┬─────────────────────────────┘
                                         │ Passed
                                         ▼
            ┌──────────────────────────────────────────────────────────┐
            │ Layer 5: Natural Language Result Abstraction             │
            │ Hides raw SQL tables/columns from final user response    │
            └──────────────────────────────────────────────────────────┘
```

### Code Implementation Snapshot ([rbac_service.py](file:///c:/Users/maddi/OneDrive/Desktop/DataI2I/Restaurant-Management-System/backend/Services/rbac_service.py))

```python
FORBIDDEN_SQL = re.compile(
    r"\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|call|execute|vacuum)\b", 
    re.I
)

@staticmethod
def validate_read_only_sql(sql: str, scope_column: str | None) -> str:
    candidate = sql.strip().rstrip(";").strip()
    if not candidate or ";" in candidate or not re.match(r"^(select|with)\b", candidate, re.I):
        raise ValueError("Only one SELECT query is allowed.")
    if "--" in candidate or "/*" in candidate or FORBIDDEN_SQL.search(candidate):
        raise ValueError("Unsafe SQL was generated.")
    if scope_column and not re.search(rf"\b{re.escape(scope_column)}\b\s*=\s*:{re.escape(scope_column)}\b", candidate, re.I):
        raise ValueError("The generated query does not contain the required data scope.")
    return candidate
```

---

## 12. End-to-End User Flow

Here is the complete user journey through the system:

```
[User Action: Login] ──> Credentials Verified ──> JWT stored in localStorage
                                                        │
                                                        ▼
[User Action: Dashboard View] <── Filtered Data Loaded <── Scope Injected from JWT
         │
         ├──> [User Action: Click AI Insights] ──> POST /generate-insights ──> Narrative Summary
         │
         ├──> [User Action: Ask Chatbot] ──> Safe Text-to-SQL ──> Natural Language Answer
         │
         └──> [User Action: Export Report] ──> PDF/Excel Generator ──> Saved to /reports
```

1. **User Authentication**: The user enters credentials or signs in with Google. The system validates credentials, attaches role and scope parameters, and stores the JWT in `localStorage`.
2. **Dashboard Navigation**: The dashboard reads the JWT scope claims (`assigned_store_id`, `assigned_district_id`, `assigned_region_id`) and queries pre-aggregated KPI endpoints.
3. **AI Insights Request**: The user clicks **Generate AI Insights**. The frontend compiles current KPI totals into an `InsightsRequest` JSON payload. FastAPI proxies this to Groq LLM, returning structured executive advice.
4. **Interactive Chatbot Session**: The user types: *"Which store had the highest cancellation rate last week?"*. The backend passes the query through RBAC scope check, LLM SQL generation, regex security validation, SQL execution, and natural language formatting.
5. **Report Generation & Download**: The user selects a date range and clicks **Export PDF/Excel**. The system compiles filtered KPI tables, appends an AI executive summary, and generates a downloadable file.

---

*Document generated for Ocean View Restaurant Management Portal system architecture, technical presentation deck creation, and developer walkthrough.*
