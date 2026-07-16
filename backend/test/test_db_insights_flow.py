import sys
from pathlib import Path
from datetime import date
from unittest.mock import MagicMock

# Add backend directory to path so we can import modules
sys.path.append(str(Path(__file__).resolve().parent.parent))

from database import SessionLocal
from models import KPI
from Services.insight_service import InsightService

def test_insights_data_source_verification():
    """
    Test case that retrieves an existing KPI record from the database,
    calls InsightService while mocking the LLM API call, and verifies that the
    data sent to the LLM indeed matches the database values.
    """
    print("[INFO] Starting read-only database data-source verification test...")
    db = SessionLocal()
    
    try:
        # 1. Fetch an existing KPI record from the database
        existing_kpi = db.query(KPI).first()
        if not existing_kpi:
            raise ValueError("No existing KPI data found in DB. Please seed the DB before running the test.")
        
        target_date = existing_kpi.kpi_date
        print(f"[INFO] Found existing KPI record in DB for store {existing_kpi.store_id} on date: {target_date}")
        print(f"[INFO] Expected values to find in LLM prompt:")
        print(f"  - Store ID: {existing_kpi.store_id}")
        print(f"  - Total Revenue: {existing_kpi.total_revenue}")
        print(f"  - Total Orders: {existing_kpi.total_orders}")
        print(f"  - Avg Order Value: {existing_kpi.average_order_value}")
        print(f"  - Customer Count: {existing_kpi.customer_count}")
        print(f"  - Cancelled Orders: {existing_kpi.cancelled_orders}")
        print(f"  - Online Orders: {existing_kpi.online_orders}")
        print(f"  - Takeaway Orders: {existing_kpi.takeaway_orders}")
        print(f"  - Dine-in Orders: {existing_kpi.dine_in_orders}")

        # 2. Initialize the service and mock the LLM generation method
        service = InsightService()
        
        # We replace the LLM call with a mock so we can capture the prompt without making a network request
        service.generate_insights_from_llm = MagicMock(return_value={
            "summary": "Mock summary",
            "insights": ["Mock insight"],
            "alerts": [],
            "recommendations": []
        })

        # 3. Run the insight generation workflow for the target date
        print("[INFO] Invoking generate_business_insights on the service...")
        insights = service.generate_business_insights(db, target_date)

        # 4. Extract the prompt sent to the LLM and run assertions
        assert service.generate_insights_from_llm.called, "The LLM generation method was not called."
        
        called_prompt = service.generate_insights_from_llm.call_args[0][0]
        
        print("\nCaptured Prompt Sent to LLM:")
        # Replace Rupee symbol with Rs. to prevent encoding issues when printing to console
        print(called_prompt.replace("₹", "Rs."))
        
        # Verify that the values inside the prompt match the values retrieved from the database
        print("[INFO] Verifying prompt contains values retrieved from the database...")
        assert f"Store ID: {existing_kpi.store_id}" in called_prompt, f"Store ID {existing_kpi.store_id} not found in prompt"
        assert str(existing_kpi.total_revenue) in called_prompt, f"Total Revenue {existing_kpi.total_revenue} not found in prompt"
        assert str(existing_kpi.total_orders) in called_prompt, f"Total Orders {existing_kpi.total_orders} not found in prompt"
        assert str(existing_kpi.average_order_value) in called_prompt, f"Average Order Value {existing_kpi.average_order_value} not found in prompt"
        assert str(existing_kpi.customer_count) in called_prompt, f"Customer Count {existing_kpi.customer_count} not found in prompt"
        assert str(existing_kpi.cancelled_orders) in called_prompt, f"Cancelled Orders {existing_kpi.cancelled_orders} not found in prompt"
        assert str(existing_kpi.online_orders) in called_prompt, f"Online Orders {existing_kpi.online_orders} not found in prompt"
        assert str(existing_kpi.takeaway_orders) in called_prompt, f"Takeaway Orders {existing_kpi.takeaway_orders} not found in prompt"
        assert str(existing_kpi.dine_in_orders) in called_prompt, f"Dine-in Orders {existing_kpi.dine_in_orders} not found in prompt"
        
        print("[SUCCESS] Verified! The prompt contains the database values of the existing record.")
        print("[SUCCESS] Database data-source verification test passed successfully!")

    except Exception as e:
        print(f"[ERROR] Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    test_insights_data_source_verification()
