import time
import os
import psutil
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from dependencies import get_db

router = APIRouter(prefix="/api/health", tags=["health"])

# Store startup time to calculate uptime
START_TIME = time.time()

@router.get("")
def get_system_health(db: Session = Depends(get_db)):
    """Check system health, database connectivity, and resource usage."""
    db_status = "Disconnected"
    try:
        db.execute(text("SELECT 1"))
        db_status = "Connected"
    except Exception:
        pass

    # Fetch CPU/memory metrics using psutil
    process = psutil.Process(os.getpid())
    rss_val = process.memory_info().rss
    heap_total = psutil.virtual_memory().total
    heap_used = psutil.virtual_memory().used

    return {
        "status": "Healthy" if db_status == "Connected" else "Unhealthy",
        "database": db_status,
        "uptime": time.time() - START_TIME,
        "memory": {
            "rss": f"{round(rss_val / 1024 / 1024)} MB",
            "heapTotal": f"{round(heap_total / 1024 / 1024)} MB",
            "heapUsed": f"{round(heap_used / 1024 / 1024)} MB"
        }
    }
