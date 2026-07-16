import sys
from pathlib import Path
from unittest.mock import MagicMock

# Add backend directory to path so we can import modules
sys.path.append(str(Path(__file__).resolve().parent.parent))

from database import SessionLocal
from models import Store
from schemas import AuthenticatedUser
from Services.chatbot_service import chatbot_service
from Services.llm_service import llm_service

def test_chatbot_db_data_use():
    """
    Test case that verifies the chatbot fetches and uses actual data from the database.
    It retrieves an existing store from the DB, mocks the SQL generation to query
    that store, and asserts that the query result passed to the answer generation
    phase matches the database values.
    """
    print("[INFO] Starting chatbot database integration flow test...")
    db = SessionLocal()
    
    try:
        # 1. Fetch an existing store from the database
        store = db.query(Store).first()
        if not store:
            raise ValueError("No store records found in the database. Please seed the DB before running the test.")
        
        print(f"[INFO] Found existing store in DB: ID={store.id}, Code={store.store_code}, Name={store.store_name}, City={store.city}")
        
        # 2. Define a test user (Corporate Admin has global scope access)
        test_user = AuthenticatedUser(
            user_id="test_admin_99",
            role="corporate admin"
        )
        
        # 3. Formulate a question
        question = f"Where is the store {store.store_name} located?"
        
        # 4. Mock the LLM SQL generator to return a SQL query targeting our store record
        # Note: We query columns matching the store's attributes to test schema consistency
        sql_query = f"SELECT store_code, store_name, city, address, manager_name FROM stores WHERE id = {store.id}"
        llm_service.generate_sql = MagicMock(return_value=sql_query)
        
        # 5. Mock the LLM Answer generator so we can inspect what database data is sent to it
        captured_results = []
        def mock_generate_answer(q, result):
            captured_results.append(result)
            return f"The store {store.store_name} is located in {store.city}."
        
        llm_service.generate_answer = MagicMock(side_effect=mock_generate_answer)
        
        # 6. Execute the chatbot workflow
        print("[INFO] Processing question through chatbot service...")
        response = chatbot_service.process_query(question, test_user, session_id="test_session_chatbot")
        
        # 7. Assertions
        print("[INFO] Verifying chatbot results...")
        assert llm_service.generate_sql.called, "LLM generate_sql was not called"
        assert llm_service.generate_answer.called, "LLM generate_answer was not called"
        
        # Verify the database query results that were passed to the LLM
        assert len(captured_results) == 1, "Expected one database result object to be sent to LLM"
        db_result = captured_results[0]
        
        print("\nDatabase Result Passed to LLM:")
        print(f"Columns: {db_result.get('columns')}")
        print(f"Rows: {db_result.get('rows')}")
        
        assert "store_name" in db_result["columns"], "Expected 'store_name' in query columns"
        assert "city" in db_result["columns"], "Expected 'city' in query columns"
        
        # Assert database content is exactly what we fetched earlier
        row_data = db_result["rows"][0]
        assert row_data["store_name"] == store.store_name, "Store name returned from query execution does not match DB"
        assert row_data["city"] == store.city, "Store city returned from query execution does not match DB"
        assert row_data["store_code"] == store.store_code, "Store code returned from query execution does not match DB"
        
        print("\nChatbot Response:")
        print(f"SQL: {response['sql']}")
        print(f"Answer: {response['answer']}")
        print(f"Rows returned: {response['rows_returned']}")
        
        assert response["rows_returned"] == 1, "Expected 1 row to be returned"
        assert store.city in response["answer"], "Expected store city in final chatbot answer"
        
        print("\n[SUCCESS] Chatbot database integration test passed successfully!")
        
    except Exception as e:
        print(f"[ERROR] Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    test_chatbot_db_data_use()
