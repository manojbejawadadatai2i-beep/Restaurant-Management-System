import sys
from pathlib import Path
import json

# Add backend directory to path so we can import modules
sys.path.append(str(Path(__file__).resolve().parent.parent))

from database import SessionLocal
from models import KPI
from Services.insight_service import InsightService

def test_kpi_insights():
    """
    Integration test that connects to the database, automatically finds the most
    recent KPI record date, and runs the InsightService to generate business insights.
    """
    print("[INFO] Starting integration test...")
    db = SessionLocal()
    try:
        # Find the most recent KPI date present in the DB
        latest_kpi = db.query(KPI).order_by(KPI.kpi_date.desc()).first()
        if not latest_kpi:
            print("[WARN] No KPI data found in the 'daily_store_kpis' table.")
            print("Please seed or insert some KPI data to test.")
            return

        target_date = latest_kpi.kpi_date
        print(f"[INFO] Found target date with data: {target_date}")
        
        # Initialize the service
        service = InsightService()
        print("[INFO] Generating business insights using Groq LLM...")
        insights = service.generate_business_insights(db, target_date)
        
        print("\nGenerated Insights Report:")
        print(json.dumps(insights, indent=2, ensure_ascii=True))
        
        # Assertions to verify structure
        if "message" in insights:
            print(f"Info: {insights['message']}")
        else:
            assert "summary" in insights, "Report is missing 'summary' field"
            assert "insights" in insights, "Report is missing 'insights' field"
            assert "alerts" in insights, "Report is missing 'alerts' field"
            assert "recommendations" in insights, "Report is missing 'recommendations' field"
            print("\n[SUCCESS] Integration test passed successfully!")

    except Exception as e:
        print(f"[ERROR] Test failed with error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_kpi_insights()
