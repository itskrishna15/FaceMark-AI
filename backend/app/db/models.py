from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, ARRAY
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from datetime import datetime
from backend.app.db.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    roll_number = Column(String, unique=True, index=True)
    
    # We will store the average embedding or primary embedding here
    # 512 dimensions for InsightFace ArcFace
    face_embedding = Column(Vector(512))

    attendance_logs = relationship("AttendanceLog", back_populates="student")


class ClassSession(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)  # e.g., "Computer Science 101"
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    attendance_logs = relationship("AttendanceLog", back_populates="class_session")


class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    class_id = Column(Integer, ForeignKey("classes.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    confidence = Column(Float)  # Confidence score of the face match

    student = relationship("Student", back_populates="attendance_logs")
    class_session = relationship("ClassSession", back_populates="attendance_logs")
