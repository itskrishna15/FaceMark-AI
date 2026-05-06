from pydantic import BaseModel
from typing import Optional, List
from backend.app.db.models import Role

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    role: Role

class UserResponse(UserBase):
    id: int
    role: Role
    class Config:
        from_attributes = True

class SubjectCreate(BaseModel):
    name: str
    code: str

class SubjectResponse(BaseModel):
    id: int
    name: str
    code: str
    class Config:
        from_attributes = True

class ClassGroupCreate(BaseModel):
    name: str
    subject_ids: List[int] = []

class ClassGroupResponse(BaseModel):
    id: int
    name: str
    subjects: List[SubjectResponse] = []
    class Config:
        from_attributes = True

class TeacherAssignmentCreate(BaseModel):
    teacher_id: int
    class_id: int
    subject_id: int

class TeacherAssignmentResponse(BaseModel):
    id: int
    teacher_id: int
    class_id: int
    subject_id: int
    class Config:
        from_attributes = True

class TeacherCreate(BaseModel):
    username: str
    password: str
    name: str

class TeacherResponse(BaseModel):
    id: int
    user_id: int
    name: str
    class Config:
        from_attributes = True

class StudentResponse(BaseModel):
    id: int
    user_id: int
    class_id: int
    name: str
    roll_number: str
    class Config:
        from_attributes = True
