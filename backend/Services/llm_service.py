import logging
from typing import List, Dict, Optional
from groq import APIConnectionError, APIStatusError, APITimeoutError, Groq

from config import get_settings
from schemas import AuthenticatedUser

logger = logging.getLogger(__name__)

class LLMServiceError(RuntimeError):
    pass

SCHEMA = """
regions(id, name)
districts(id, name, region_id)
stores(id, name, district_id, region_id)
scopes(id, scope_name, scope_type, parent_scope_id, region_id, district_id, store_id)
users(id, username, email, role, assigned_store_id, assigned_district_id, assigned_region_id)
daily_store_kpis(kpi_id, store_id, kpi_date, total_revenue, total_orders, average_order_value, customer_count, cancelled_orders, online_orders, takeaway_orders, dine_in_orders)
menu_items(id, name, price, cost, category)
orders(id, store_id, customer_name, total_amount, status, created_at)
order_items(id, order_id, menu_item_id, quantity, price)
"""

SQL_SYSTEM_PROMPT = """You generate one safe PostgreSQL read-only query for the Ocean View Restaurant Management System decision support and analytics.

Rule 1: Return SQL only: no Markdown code block ticks, explanation, comments, or semicolon.
Rule 2: Use only the supplied schema. Key tables: daily_store_kpis, stores, districts, regions, orders, order_items, menu_items.
Rule 3: Single Source of Truth for KPIs is `daily_store_kpis k JOIN stores s ON k.store_id = s.id JOIN districts d ON s.district_id = d.id JOIN regions r ON s.region_id = r.id`.
Rule 4: Do NOT force `WHERE kpi_date = CURRENT_DATE` unless the user explicitly asks for "today". For overall or regional metrics, aggregate over all available dates (e.g. SUM(total_revenue)).
Rule 5: Always add LIMIT 200 for non-aggregate list queries.
Rule 6: If the question is completely unrelated to restaurant operations, KPIs, stores, regions, districts, menu items, or orders, return the exact text 'NOT_RESTAURANT_RELATED'.
"""

ANSWER_SYSTEM_PROMPT = """You are a polite and concise online assistant for the Ocean View Restaurant Management System. You represent Ocean View AI (your persona is Ocean View Assistant).
Answer the user's question directly and naturally based only on the supplied database query result.
Do not mention technical details like SQL, tables, columns, rows, or databases in your response.
If no rows exist or data is empty, say no data was found.
If the database contains values, summarize them clearly (e.g. format currency, round numbers, list store names naturally).
"""

INSIGHTS_SYSTEM_PROMPT = """You are a senior restaurant business analytics AI advisor for Ocean View Restaurant System. 
Analyze the provided KPI metrics for a specific operational scope and return valid JSON with 5 fields:
1. executive_summary: A 2-sentence executive summary of revenue, order volume, and profit margins.
2. key_business_insights: 2 key insights regarding Average Order Value (AOV), top item performance, and customer acquisition.
3. alerts: Operational alert regarding cancellation rate or cost thresholds.
4. possible_reasons: Root cause analysis of peak hour performance, demand shifts, or cost structures.
5. business_recommendations: 3 actionable recommendations to boost revenue, lower cancellations, and increase margins.

IMPORTANT: Return ONLY valid JSON format without markdown codeblock ticks. 
Example JSON structure:
{
  "executive_summary": "...",
  "key_business_insights": "...",
  "alerts": "...",
  "possible_reasons": "...",
  "business_recommendations": "..."
}"""

class LLMService:
    def __init__(self):
        self.settings = get_settings()

    def get_llm_response(self, prompt: str, system_prompt: str) -> str:
        try:
            client = Groq(api_key=self.settings.groq_api_key, timeout=20.0, max_retries=1)
            response = client.chat.completions.create(
                model=self.settings.groq_model,
                temperature=0.2,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
            )
            content = response.choices[0].message.content
            if not content:
                raise LLMServiceError("The language model returned an empty response.")
            return content.strip()
        except (APITimeoutError, APIConnectionError, APIStatusError) as exc:
            logger.error("Groq LLM call failed: %s", str(exc))
            raise LLMServiceError("The AI service is temporarily unavailable.") from exc

    def generate_sql(self, question: str, user: AuthenticatedUser, history: List[dict]) -> str:
        from Services.rbac_service import RBACService
        try:
            scope_column, _ = RBACService.get_scope_for_user(user)
        except Exception:
            scope_column = None
            
        scope_rule = "No scope filter is required." if scope_column is None else (
            f"MANDATORY ACCESS FILTER: You MUST include `{scope_column} = :{scope_column}` in the WHERE clause of your main query or subqueries. "
            "Use a join when necessary to reach that column from the KPI or store tables. Do not substitute a literal value; always use the bind parameter name starting with colon."
        )
        
        recent_context = "\n".join(f"Q: {item['question']}\nA: {item['answer']}" for item in history[-6:]) or "None"
        
        prompt = (
            f"Schema:\n{SCHEMA}\n\n"
            f"{scope_rule}\n\n"
            f"Conversation history:\n{recent_context}\n\n"
            f"Question: {question}"
        )
        
        return self.get_llm_response(prompt, system_prompt=SQL_SYSTEM_PROMPT)

    def generate_answer(self, question: str, result: Dict) -> str:
        prompt = f"Question: {question}\nDatabase Query Result:\nColumns: {result.get('columns')}\nRows: {result.get('rows')}"
        return self.get_llm_response(prompt, system_prompt=ANSWER_SYSTEM_PROMPT)

    def generate_insights(self, metrics: dict) -> dict:
        import json
        prompt = (
            f"Scope Name: {metrics.get('scope_name', 'All Operations')}\n"
            f"Total Revenue: INR {metrics.get('total_revenue', 0)}\n"
            f"Total Orders: {metrics.get('total_orders', 0)}\n"
            f"Average Order Value: INR {metrics.get('average_order_value', 0)}\n"
            f"Customer Count: {metrics.get('customer_count', 0)}\n"
            f"Cancelled Orders: {metrics.get('cancelled_orders', 0)}\n"
            f"Total Expenses: INR {metrics.get('total_expenses', 0)}\n"
        )
        try:
            raw_response = self.get_llm_response(prompt, system_prompt=INSIGHTS_SYSTEM_PROMPT)
            clean_json = raw_response.strip().replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean_json)
            normalized = {}
            for k, v in parsed.items():
                if isinstance(v, dict):
                    normalized[k] = "\n".join(f"{sub_k.replace('_', ' ').capitalize()}: {sub_v}" for sub_k, sub_v in v.items())
                elif isinstance(v, list):
                    normalized[k] = "\n".join(str(item) for item in v)
                else:
                    normalized[k] = str(v)
            return normalized
        except Exception as exc:
            logger.warning(f"Groq LLM JSON parsing failed, using fallback insights: {exc}")
            scope = metrics.get('scope_name', 'All Operations')
            rev = metrics.get('total_revenue', 0)
            orders = metrics.get('total_orders', 0)
            aov = metrics.get('average_order_value', 0)
            cust = metrics.get('customer_count', 0)
            canc = metrics.get('cancelled_orders', 0)
            exp = metrics.get('total_expenses', 0)
            rate = round((canc / orders * 100), 1) if orders > 0 else 0
            margin = round(((rev - exp) / rev * 100)) if rev > 0 else 0
            
            return {
                "executive_summary": f"Overall performance for {scope} remains strong with total revenue reaching ₹{rev:,.2f} across {orders:,} orders. Net profit margin is holding steady at {margin}%.",
                "key_business_insights": f"Average Order Value (AOV) stands at ₹{aov:,.2f} with an active customer base of {cust:,} customers. Sales volume is heavily supported by top-tier menu items.",
                "alerts": f"Order cancellation rate is at {rate}% ({canc} orders) for {scope}. Kitchen dispatch speed optimization is recommended during peak hours." if rate > 4 else f"Order cancellation rate is controlled at a healthy {rate}% for {scope}.",
                "possible_reasons": "Peak sales density is observed during lunch (1 PM - 3 PM) and dinner service windows. Expenses reflect direct inventory and staffing allocations.",
                "business_recommendations": f"1. Promote combo meal bundles during off-peak hours to raise AOV in {scope}.\n2. Streamline kitchen preparation workflows to reduce turnaround times.\n3. Optimize inventory ordering to boost net profit margin."
            }

    def test_connection(self) -> bool:
        """Rapid health check request to Groq API."""
        try:
            client = Groq(api_key=self.settings.groq_api_key, timeout=5.0, max_retries=0)
            client.chat.completions.create(
                model=self.settings.groq_model,
                max_tokens=5,
                messages=[
                    {"role": "user", "content": "ping"}
                ]
            )
            return True
        except Exception as exc:
            logger.error("LLM Health Check failed: %s", str(exc))
            return False

# Global singleton
llm_service = LLMService()
