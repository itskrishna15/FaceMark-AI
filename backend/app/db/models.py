from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum as SQLEnum, Table
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from datetime import datetime
import enum
from backend.app.db.database import Base

class Role(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(SQLEnum(Role), default=Role.STUDENT)

    teacher_profile = relationship("Teacher", back_populates="user", uselist=False)
    student_profile = relationship("Student", back_populates="user", uselist=False)

class_subjects = Table(
    "class_subjects",
    Base.metadata,
    Column("class_id", Integer, ForeignKey("classes.id"), primary_key=True),
    Column("subject_id", Integer, ForeignKey("subjects.id"), primary_key=True)
)

class ClassGroup(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # e.g., "Batch 2024 CS"

    students = relationship("Student", back_populates="class_group")
    assignments = relationship("TeacherAssignment", back_populates="class_group")
    subjects = relationship("Subject", secondary=class_subjects, back_populates="classes")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    
    assignments = relationship("TeacherAssignment", back_populates="subject")
    classes = relationship("ClassGroup", secondary=class_subjects, back_populates="subjects")

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    name = Column(String)
    
    user = relationship("User", back_populates="teacher_profile")
    assignments = relationship("TeacherAssignment", back_populates="teacher")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    name = Column(String, index=True)
    roll_number = Column(String, unique=True, index=True)
    
    # We will store the average embedding or primary embedding here
    # 512 dimensions for InsightFace ArcFace
    face_embedding = Column(Vector(512))

    user = relationship("User", back_populates="student_profile")
    class_group = relationship("ClassGroup", back_populates="students")
    attendance_logs = relationship("AttendanceLog", back_populates="student")

class TeacherAssignment(Base):
    __tablename__ = "teacher_assignments"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    class_id = Column(Integer, ForeignKey("classes.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))

    teacher = relationship("Teacher", back_populates="assignments")
    class_group = relationship("ClassGroup", back_populates="assignments")
    subject = relationship("Subject", back_populates="assignments")
    sessions = relationship("ClassSession", back_populates="assignment")

class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("teacher_assignments.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    assignment = relationship("TeacherAssignment", back_populates="sessions")
    attendance_logs = relationship("AttendanceLog", back_populates="class_session")

class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    session_id = Column(Integer, ForeignKey("class_sessions.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    confidence = Column(Float)  # Confidence score of the face match

    student = relationship("Student", back_populates="attendance_logs")
    class_session = relationship("ClassSession", back_populates="attendance_logs")
