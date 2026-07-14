"""
Resets all placeholder passwords in restaurant_dashboard.
Each user's default password = their employee_id (e.g. EMP001 -> password is "EMP001")
"""
# pyrefly: ignore [missing-import]
import bcrypt
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:Manoj%402005@localhost:5432/restaurant_dashboard"
engine = create_engine(DATABASE_URL)

PLACEHOLDER = "PLACEHOLDER"

with engine.connect() as conn:
    users = conn.execute(text("SELECT id, employee_id, email, password_hash FROM users")).fetchall()
    print(f"Total users found: {len(users)}\n")

    fixed = 0
    skipped = 0

    for user in users:
        pw_hash = user[3] or ""
        if PLACEHOLDER in pw_hash or pw_hash == "":
            # Default password = employee_id (e.g. "EMP001")
            default_pw = user[1] if user[1] else "Password@123"
            new_hash = bcrypt.hashpw(default_pw.encode(), bcrypt.gensalt()).decode()
            conn.execute(
                text("UPDATE users SET password_hash = :h WHERE id = :id"),
                {"h": new_hash, "id": user[0]}
            )
            print(f"  RESET  {str(user[2]):<40}  password -> {default_pw}")
            fixed += 1
        else:
            print(f"  SKIP   {str(user[2]):<40}  (already has real password)")
            skipped += 1

    conn.commit()
    print(f"\nDone! {fixed} passwords reset, {skipped} skipped.")
    print("Each user's password is now their Employee ID (e.g. EMP001, EMP002...)")
