import sys
from pathlib import Path
from datetime import date, datetime
from unittest.mock import MagicMock

# Add backend directory to path so we can import modules
sys.path.append(str(Path(__file__).resolve().parent.parent))

from database import SessionLocal
from models import KPI
from Services.insight_service import InsightService

def test_insights_data_source_verification():
    """
    Test case that inserts a unique, recognizable KPI record into the database,
    calls InsightService while mocking the LLM API call, and verifies that the
    data sent to the LLM is indeed retrieved from the database.
    """
    print("[INFO] Starting database data-source verification test...")
    db = SessionLocal()
    
    # Define a unique date and distinct values to ensure no overlap with existing data
    test_date = date(2999, 12, 31)
    unique_revenue = 987654.0
    unique_orders = 1234
    unique_aov = 799.0
    unique_customers = 1111
    unique_cancelled = 22
    unique_online = 800
    unique_takeaway = 300
    unique_dine_in = 134
    
    dummy_kpi = None
    
    try:
        # Fetch an existing valid store_id to avoid ForeignKeyViolation
        existing_kpi = db.query(KPI).first()
        if not existing_kpi:
            raise ValueError("No existing KPI data found in DB. Please seed the DB before running the test.")
        
        valid_store_id = existing_kpi.store_id
        print(f"[INFO] Using existing valid store_id: {valid_store_id}")

        # 1. Clean up any leftover test data for this date
        db.query(KPI).filter(KPI.kpi_date == test_date).delete()
        db.commit()

        # 2. Insert the mock KPI record into the database
        print(f"[INFO] Inserting mock KPI record into the database for date: {test_date}...")
        now = datetime.now()
        dummy_kpi = KPI(
            store_id=valid_store_id,
            kpi_date=test_date,
            total_revenue=unique_revenue,
            total_orders=unique_orders,
            average_order_value=unique_aov,
            customer_count=unique_customers,
            cancelled_orders=unique_cancelled,
            online_orders=unique_online,
            takeaway_orders=unique_takeaway,
            dine_in_orders=unique_dine_in,
            created_at=now,
            updated_at=now
        )
        db.add(dummy_kpi)
        db.commit()
        db.refresh(dummy_kpi)
        print("[SUCCESS] Mock KPI record inserted successfully.")

        # 3. Initialize the service and mock the LLM generation method
        service = InsightService()
        
        # We replace the LLM call with a mock so we can capture the prompt without making a network request
        service.generate_insights_from_llm = MagicMock(return_value={
            "summary": "Mock summary",
            "insights": ["Mock insight"],
            "alerts": [],
            "recommendations": []
        })

        # 4. Run the insight generation workflow
        print("[INFO] Invoking generate_business_insights on the service...")
        insights = service.generate_business_insights(db, test_date)

        # 5. Extract the prompt sent to the LLM and run assertions
        assert service.generate_insights_from_llm.called, "The LLM generation method was not called."
        
        called_prompt = service.generate_insights_from_llm.call_args[0][0]
        
        print("\nCaptured Prompt Sent to LLM:")
        # Replace Rupee symbol with Rs. to prevent encoding issues when printing to console
        print(called_prompt.replace("₹", "Rs."))
        
        # Verify that the values inside the prompt match the values inserted in the database
        print("[INFO] Verifying prompt contains values retrieved from the database...")
        assert f"Total Revenue: ₹{unique_revenue}" in called_prompt, "Total Revenue from DB not found in prompt"
        assert f"Total Orders: {unique_orders}" in called_prompt, "Total Orders from DB not found in prompt"
        assert f"Average Order Value: ₹{unique_aov}" in called_prompt, "Average Order Value from DB not found in prompt"
        assert f"Customer Count: {unique_customers}" in called_prompt, "Customer Count from DB not found in prompt"
        assert f"Cancelled Orders: {unique_cancelled}" in called_prompt, "Cancelled Orders from DB not found in prompt"
        assert f"Online Orders: {unique_online}" in called_prompt, "Online Orders from DB not found in prompt"
        assert f"Takeaway Orders: {unique_takeaway}" in called_prompt, "Takeaway Orders from DB not found in prompt"
        assert f"Dine-in Orders: {unique_dine_in}" in called_prompt, "Dine-in Orders from DB not found in prompt"
        
        print("[SUCCESS] Verified! The prompt contains all unique values sourced directly from the database.")
        print("[SUCCESS] Database data-source verification test passed successfully!")

    except Exception as e:
        print(f"[ERROR] Test failed with error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
        raise e
    finally:
        # 6. Clean up the database by deleting the test record
        try:
            print(f"[INFO] Cleaning up test data from DB for date: {test_date}...")
            db.query(KPI).filter(KPI.kpi_date == test_date).delete()
            db.commit()
        except Exception as cleanup_err:
            print(f"[WARN] Failed to clean up: {cleanup_err}")
            db.rollback()
        db.close()

if __name__ == "__main__":
    test_insights_data_source_verification()
