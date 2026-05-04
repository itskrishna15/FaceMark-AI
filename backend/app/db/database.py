from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Using the database credentials from setup.sh
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://facemark:facemark123@localhost/facemark_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
