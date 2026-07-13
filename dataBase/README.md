# Create the table

psql -U postgres -d restaurant_portal -f dataBase/schema/<table>.sql

# Seed initial data (if applicable)

psql -U postgres -d restaurant*portal -f dataBase/seeds/seed*<table>.sql

<!-- psql -U postgres -d restaurant_portal -f dataBase/schema.sql -->
