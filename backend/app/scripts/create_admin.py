import sys
import os

# Add project root to python path to import backend properly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from backend.app.db.database import SessionLocal, engine, Base
from backend.app.db.models import User, Role
from backend.app.core.security import get_password_hash

def create_admin(username, password):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.username == username).first()
        if existing_admin:
            print(f"User {username} already exists.")
            return
            
        hashed_password = get_password_hash(password)
        admin = User(username=username, hashed_password=hashed_password, role=Role.ADMIN)
        db.add(admin)
        db.commit()
        print(f"Admin user {username} created successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python -m backend.app.scripts.create_admin <username> <password>")
        sys.exit(1)
        
    username = sys.argv[1]
    password = sys.argv[2]
    create_admin(username, password)
