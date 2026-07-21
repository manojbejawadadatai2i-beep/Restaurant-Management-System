# Ocean View Restaurant Management System — API Endpoints Documentation

## 1. Overview
The Ocean View Restaurant Management System backend is built with Express.js (`server/index.js`) and interfaces directly with a local PostgreSQL database (`restaurant_portal`). It implements strictly enforced Role-Based Access Control (RBAC) across four primary administrative tiers:

- **Store Manager**: Access isolated strictly to single assigned store.
- **District Manager**: Access limited to assigned district and its underlying store outlets.
- **Regional Manager**: Access limited to assigned region, its districts, and stores.
- **Corporate Administrator / Super Admin**: Unrestricted network-wide access across all stores.

---

## 2. API Endpoints Reference Table

| Endpoint Route | HTTP Method | Handler Function Name | Description & Primary Scope |
| :--- | :---: | :--- | :--- |
| `/api/meta` | `GET` | Inline Handler | Fetches lookup metadata for regions, districts, stores, and roles. |
| `/api/users` | `GET` | Inline Handler | Retrieves user list with joined role & scope metadata. |
| `/api/users` | `POST` | Inline Handler | Creates a new user with scope assignment logic. |
| `/api/users/:id` | `PUT` | Inline Handler | Updates user role, username, email, and scope mappings. |
| `/api/users/:id` | `DELETE` | Inline Handler | Deletes a user account. |
| `/api/dashboard` | `GET` | Inline Handler | Core analytics endpoint returning real-time metrics, 30-day trends, channel distributions, and leaderboards. |
| `/api/generate-insights` | `POST` | `handleGenerateInsights` | Generates structured AI business insights via Groq or local Ollama. |
| `/chat/query` | `POST` | `handleChatQuery` | AI Assistant chatbot endpoint with PostgreSQL context injection & RBAC guardrails. |

---

## 3. Detailed Endpoint Specifications

### 3.1 Metadata Endpoint
- **Route**: `GET /api/meta`
- **Description**: Fetches dropdown selection choices for regions, districts, stores, and user roles.
- **Query Parameters**: None.
- **Response Format**:
  ```json
  {
    "regions": [{ "id": 1, "name": "North Region" }],
    "districts": [{ "id": 1, "name": "District A", "region_id": 1 }],
    "stores": [{ "id": 1, "name": "Store 1", "district_id": 1, "region_id": 1 }],
    "roles": [{ "id": 1, "name": "Store Manager" }]
  }
  ```

---

### 3.2 User Management Endpoints

#### `GET /api/users`
- **Description**: Retrieves all registered users in the system alongside assigned store, district, and region names.
- **Database Query**:
  ```sql
  SELECT u.id, u.username, u.email, u."role", u.role_id,
         u.assigned_store_id, s.name as store_name,
         u.assigned_district_id, d.name as district_name,
         u.assigned_region_id, r.name as region_name,
         u.created_at
  FROM users u
  LEFT JOIN stores s ON u.assigned_store_id = s.id
  LEFT JOIN districts d ON u.assigned_district_id = d.id
  LEFT JOIN regions r ON u.assigned_region_id = r.id
  ORDER BY u.id ASC;
  ```

#### `POST /api/users`
- **Description**: Creates a new user. Enforces scope clearing (e.g., clearing `assigned_store_id` if promoted to District/Regional Manager).
- **Request Body**:
  ```json
  {
    "username": "John Doe",
    "email": "john@oceanview.com",
    "role": "District Manager",
    "role_id": 3,
    "assigned_store_id": null,
    "assigned_district_id": 2,
    "assigned_region_id": 1
  }
  ```

#### `PUT /api/users/:id`
- **Description**: Updates user credentials, role, and assigned operational scope.
- **Special SQL Handling**: Double-quotes PostgreSQL system reserved keyword `"role"`.
- **Database Query**:
  ```sql
  UPDATE users 
  SET username = $1, email = $2, "role" = $3, role_id = $4,
      assigned_store_id = $5, assigned_district_id = $6, assigned_region_id = $7,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $8
  ```

#### `DELETE /api/users/:id`
- **Description**: Deletes user by ID.
- **Database Query**: `DELETE FROM users WHERE id = $1`

---

### 3.3 Dashboard Analytics Endpoint
- **Route**: `GET /api/dashboard`
- **Query Parameters**:
  - `userId` (required): Current user ID for RBAC scope resolution.
  - `kpiDate` (optional): Date filter (YYYY-MM-DD).
  - `filterRegionId` (optional): Scope filter for Region.
  - `filterDistrictId` (optional): Scope filter for District.
  - `filterStoreId` (optional): Scope filter for Store.
- **RBAC Logic Execution**:
  1. Inspects user's assigned role from `users` table.
  2. If `Store Manager`, resolves scope strictly to `assigned_store_id`.
  3. If `District Manager`, resolves scope to `filterStoreId` (if passed) or `assigned_district_id`.
  4. If `Regional Manager`, resolves scope to `filterStoreId`, `filterDistrictId`, or `assigned_region_id`.
  5. If `Corporate Admin`, resolves to applied filters or `All Stores`.
- **Response Format**:
  ```json
  {
    "metrics": {
      "totalRevenue": 14442.00,
      "totalOrders": 50,
      "avgOrderValue": 288.84,
      "totalCustomers": 62,
      "totalCost": 8376.36,
      "totalProfit": 6065.64,
      "profitMargin": 42,
      "cancellationRate": 6
    },
    "scopeTable": [ ... stores listing ... ],
    "scopeName": "Store 3",
    "revenueTrend": [
      { "name": "Jul 20", "revenue": 20276, "profit": 8515.92, "orders": 37, "Completed": 37, "Cancelled": 0 },
      { "name": "Jul 21", "revenue": 7061, "profit": 2965.62, "orders": 23, "Completed": 23, "Cancelled": 0 }
    ],
    "orderDistribution": [
      { "name": "Dine-In", "value": 19, "color": "#3b82f6" },
      { "name": "Takeaway", "value": 11, "color": "#f59e0b" },
      { "name": "Online Delivery", "value": 10, "color": "#10b981" }
    ]
  }
  ```

---

### 3.4 AI Insights Generation Endpoint
- **Route**: `POST /api/generate-insights`
- **Handler**: `handleGenerateInsights`
- **Request Body**:
  ```json
  {
    "total_revenue": 14442,
    "total_orders": 50,
    "average_order_value": 288.84,
    "customer_count": 62,
    "cancelled_orders": 3,
    "total_expenses": 8376.36,
    "scope_name": "Store 3",
    "past_data_trend": [ ... ],
    "order_channel_distribution": [ ... ]
  }
  ```
- **LLM Provider Priority**:
  1. Primary: Groq API (`llama-3.3-70b-versatile`).
  2. Fallback: Local Ollama Model (`qwen2.5` / `llama3`).
- **Response Format**:
  ```json
  {
    "status": "success",
    "insights": {
      "executive_summary": "...",
      "key_business_insights": "...",
      "alerts": "...",
      "possible_reasons": "...",
      "business_recommendations": "..."
    }
  }
  ```

---

### 3.5 AI Assistant Chatbot Endpoint
- **Route**: `POST /chat/query`
- **Handler**: `handleChatQuery`
- **Request Body**:
  ```json
  {
    "query": "What are my today sales?",
    "userId": 3,
    "user_role": "District Manager"
  }
  ```
- **RBAC Guardrail Logic**:
  - Enforces strict role prompt boundaries.
  - Rejects off-topic political/general knowledge queries.
  - Rejects attempts by Store Managers to view network/other store data.
  - Rejects attempts by District Managers to view regional or non-assigned district data.
- **Example Rejection Response**:
  ```json
  {
    "answer": "As District Manager for District C, your authorization is strictly limited to your assigned district (District C) and its stores. You do not have permission to view regional data, other districts, or network-wide totals."
  }
  ```
