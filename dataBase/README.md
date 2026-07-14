# Create the table

psql -U postgres -d restaurant_portal -f dataBase/schema/<table>.sql

# Seed initial data (if applicable)

psql -U postgres -d restaurant*portal -f dataBase/seeds/seed*<table>.sql

<!-- psql -U postgres -d restaurant_portal -f dataBase/schema.sql -->

backend/
│
├── app/
│
├── api/
│ ├── auth.py
│ ├── dashboard.py
│ ├── reports.py
│ ├── stores.py
│ ├── users.py
│
├── services/
│ ├── dashboard_service.py
│ ├── report_service.py
│ ├── auth_service.py
│ ├── metrics_service.py
│
├── repositories/
│ ├── dashboard_repository.py
│ ├── metrics_repository.py
│ ├── store_repository.py
│ ├── user_repository.py
│
├── models/
│
├── schemas/
│
├── database.py
│
└── main.py
