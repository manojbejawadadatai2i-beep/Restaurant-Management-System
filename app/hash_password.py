# pyrefly: ignore [missing-import]
import bcrypt

password = "admin123"

hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

# pyrefly: ignore [parse-error]
print(hashed.decode())


password = "admin123"

hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

print(hashed.decode())