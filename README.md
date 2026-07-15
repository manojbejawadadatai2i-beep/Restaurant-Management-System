# AI Agent Service

## Project Overview
This project generates AI-powered business insights from restaurant KPI data. It fetches KPI records from a PostgreSQL database based on the selected date and uses the Groq LLM to generate business insights in JSON format.

## Tech Stack
- Python
- FastAPI
- PostgreSQL
- SQLAlchemy
- Groq API

## Features
- Fetch KPI data by date from PostgreSQL
- Generate AI-powered business insights
- Return insights in JSON format
- Swagger API documentation

## Installation

1. Clone the repository.
2. Install the required packages:

```bash
pip install -r requirements.txt
```

3. Add your environment variables to the `.env` file.

4. Start the server:

```bash
uvicorn app.main:app --reload
```

## API Documentation

Open Swagger UI:

```
http://127.0.0.1:8000/docs
```

## API Endpoints

- `GET /` – Check if the API is running.
- `GET /health` – Health check endpoint.
- `POST /generate-insights` – Generate business insights for the selected KPI date.

## Request Example

```json
{
  "kpi_date": "2026-07-14"
}
```

## Response

The API returns a JSON response containing:
- Summary
- Insights
- Alerts
- Recommendations