import sys
import os
sys.path.insert(0, os.path.abspath('C:/Users/ojhav/OneDrive/Desktop/Swigato/backend'))
from app.db.session import SessionLocal
from app.models.user import User, Role, UserRole

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"User: {u.email}, Roles: {u.role_names}")
