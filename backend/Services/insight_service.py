import json
import os
import sys
from pathlib import Path
from datetime import date
from sqlalchemy.orm import Session
from groq import Groq

# Ensure parent directory is in sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from Repositories.kpi_repository import KPIRepository

class InsightService:
    def __init__(self):
        # Initialize Groq client
        api_key = os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=api_key) if api_key else None

    def build_prompt(self, kpi_text: str) -> str:
        return f"""
You are a highly experienced Business Intelligence Analyst and Data Analytics Expert.

Your task is to analyze the restaurant KPI data provided below and generate concise, meaningful business insights, critical alerts, and actionable recommendations for business managers.

Restaurant KPI Data
---------------------
{kpi_text}

Analyze the KPI data and return ONLY a valid JSON object.

Use exactly this structure:

{{
  "summary": "2-3 sentence overview of overall business performance.",

  "insights": [
    "Insight 1",
    "Insight 2",
    "Insight 3",
    "Insight 4"
  ],

  "alerts": [
    "Alert 1",
    "Alert 2",
    "Alert 3"
  ],

  "recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3",
    "Recommendation 4"
  ]
}}

Guidelines:

Summary:
- Provide a brief overview of the overall business performance.
- Mention the general performance direction based on available KPI data.
- Keep it professional and suitable for business managers.

Insights:
- Identify meaningful patterns and observations from the KPI data.
- Analyze relationships between:
  - Revenue
  - Orders
  - Average Order Value
  - Customer Count
  - Cancelled Orders
  - Online Orders
  - Takeaway Orders
  - Dine-in Orders
- Explain possible reasons only when supported by the available data.
- Do not simply repeat KPI values.
- If the available data is insufficient, clearly mention that additional data is required.

Alerts:
- Identify critical issues or unusual conditions that require management attention.
- Generate alerts only when the KPI data indicates a potential business problem.
- Focus on:
  - Significant revenue decline or poor revenue performance
  - High cancellation levels
  - Low customer engagement
  - Drop in order volume
  - Poor performance of online, takeaway, or dine-in channels
  - Operational inefficiencies
- Alerts should be concise and action-oriented.
- If no critical issues are identified, return an empty array:
  "alerts": []

Recommendations:
- Provide practical, business-oriented, and actionable recommendations.
- Recommendations should focus on improving:
  - Revenue growth
  - Customer engagement
  - Order fulfillment
  - Operational efficiency
  - Online, takeaway, and dine-in performance
- Recommendations should directly address identified insights and alerts.
- Avoid generic suggestions.

IMPORTANT:
- Return ONLY valid JSON.
- Do NOT use markdown.
- Do NOT wrap the JSON inside triple backticks.
- Do NOT add explanations before or after the JSON.
- Ensure the response is valid JSON that can be parsed directly.
- Do NOT fabricate facts or unsupported conclusions.
- Maintain a professional Business Intelligence reporting style.
"""

    def generate_insights_from_llm(self, prompt: str) -> dict:
        if not self.client:
            # Re-read if key was set dynamically
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ValueError("GROQ_API_KEY environment variable is not set. Please add it to your .env file.")
            self.client = Groq(api_key=api_key)

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        content = response.choices[0].message.content
        
        # Clean potential markdown wrapping from LLM output
        cleaned_content = content.strip()
        if cleaned_content.startswith("```json"):
            cleaned_content = cleaned_content[7:]
        elif cleaned_content.startswith("```"):
            cleaned_content = cleaned_content[3:]
        if cleaned_content.endswith("```"):
            cleaned_content = cleaned_content[:-3]
            
        return json.loads(cleaned_content.strip())

    def generate_business_insights(self, db: Session, kpi_date: date) -> dict:
        """
        Main workflow method: retrieves KPI data from repository, constructs the prompt,
        sends it to Groq API, and returns parsed insights.
        """
        kpi_records = KPIRepository.get_kpis_by_date(db, kpi_date)

        if not kpi_records:
            return {
                "message": f"No KPI data found for {kpi_date}"
            }

        kpi_text = ""
        for row in kpi_records:
            kpi_text += f"""
Store ID: {row.store_id}
KPI ID: {row.kpi_id}
Report Date: {row.kpi_date}

Total Revenue: ₹{row.total_revenue}
Total Orders: {row.total_orders}
Average Order Value: ₹{row.average_order_value}
Customer Count: {row.customer_count}
Cancelled Orders: {row.cancelled_orders}
Online Orders: {row.online_orders}
Takeaway Orders: {row.takeaway_orders}
Dine-in Orders: {row.dine_in_orders}

---------------------------------------
"""

        prompt = self.build_prompt(kpi_text)
        insights = self.generate_insights_from_llm(prompt)
        return insights
