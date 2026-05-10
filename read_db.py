#!/usr/bin/env python3
"""
Database Reader Script for FaceMark-AI
Reads and displays all data from all tables in the PostgreSQL database.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.db.database import DATABASE_URL

def read_all_tables():
    """Read and display all data from all tables in the database."""

    # Create engine and session
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    with SessionLocal() as session:
        # Get all table names
        result = session.execute(text("""
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename;
        """))

        tables = [row[0] for row in result.fetchall()]

        print("📊 FaceMark-AI Database Contents")
        print("=" * 50)

        for table_name in tables:
            print(f"\n🔍 Table: {table_name}")
            print("-" * (len(table_name) + 8))

            try:
                # Get all data from the table
                result = session.execute(text(f"SELECT * FROM {table_name} LIMIT 100;"))
                columns = result.keys()
                rows = result.fetchall()

                if not rows:
                    print("📭 No data in this table")
                    continue

                # Print column headers
                print(" | ".join(f"{col:<20}" for col in columns))
                print("-" * (len(columns) * 22))

                # Print data rows
                for row in rows:
                    formatted_row = []
                    for value in row:
                        if value is None:
                            formatted_row.append("NULL".ljust(20))
                        elif isinstance(value, (list, tuple)):
                            # Handle arrays/vectors
                            if len(str(value)) > 17:
                                formatted_row.append(f"[{len(value)} items]".ljust(20))
                            else:
                                formatted_row.append(str(value).ljust(20))
                        else:
                            str_value = str(value)
                            if len(str_value) > 17:
                                formatted_row.append(str_value[:17] + "...".ljust(3))
                            else:
                                formatted_row.append(str_value.ljust(20))
                    print(" | ".join(formatted_row))

                print(f"\n📊 Total rows in {table_name}: {len(rows)}")
                if len(rows) == 100:
                    print("⚠️  Showing first 100 rows only")

            except Exception as e:
                print(f"❌ Error reading table {table_name}: {e}")

        print("\n" + "=" * 50)
        print("✅ Database reading complete!")

if __name__ == "__main__":
    # Check if we're in the virtual environment
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Warning: Not running in virtual environment")
        print("Activate with: source venv/bin/activate")

    try:
        read_all_tables()
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        print("Make sure PostgreSQL is running and the database exists.")
        print("Run setup.sh if needed.")