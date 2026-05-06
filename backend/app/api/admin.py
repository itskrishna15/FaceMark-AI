from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from backend.app.db.database import get_db
from backend.app.db.models import User, Role, ClassGroup, Subject, Teacher, Student, TeacherAssignment, ClassSession, AttendanceLog
from backend.app.core.security import get_current_admin, get_password_hash
from backend.app.schemas.schemas import ClassGroupCreate, ClassGroupResponse, SubjectCreate, SubjectResponse, TeacherAssignmentCreate, TeacherCreate
from backend.app.services.face_engine import extract_faces_and_embeddings, get_average_embedding

router = APIRouter()

# -- CLASSES --
@router.post("/classes", response_model=ClassGroupResponse)
def create_class(class_data: ClassGroupCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_class = ClassGroup(name=class_data.name)
    
    if class_data.subject_ids:
        subjects = db.query(Subject).filter(Subject.id.in_(class_data.subject_ids)).all()
        db_class.subjects = subjects

    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

@router.get("/classes", response_model=List[ClassGroupResponse])
def get_classes(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return db.query(ClassGroup).options(joinedload(ClassGroup.subjects)).all()

@router.delete("/classes/{class_id}")
def delete_class(class_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_class = db.query(ClassGroup).filter(ClassGroup.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
        
    for a in db_class.assignments:
        for s in a.sessions:
            db.query(AttendanceLog).filter(AttendanceLog.session_id == s.id).delete()
            db.delete(s)
        db.delete(a)
        
    for st in db_class.students:
        db.query(AttendanceLog).filter(AttendanceLog.student_id == st.id).delete()
        user = st.user
        db.delete(st)
        if user: db.delete(user)
        
    db.delete(db_class)
    db.commit()
    return {"message": "Class deleted"}

# -- SUBJECTS --
@router.post("/subjects", response_model=SubjectResponse)
def create_subject(subject_data: SubjectCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    if db.query(Subject).filter(Subject.code == subject_data.code).first():
        raise HTTPException(status_code=400, detail="Subject code already exists")

    db_subject = Subject(name=subject_data.name, code=subject_data.code)
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.get("/subjects", response_model=List[SubjectResponse])
def get_subjects(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return db.query(Subject).all()

@router.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    for a in db_subject.assignments:
        for s in a.sessions:
            db.query(AttendanceLog).filter(AttendanceLog.session_id == s.id).delete()
            db.delete(s)
        db.delete(a)
        
    db.delete(db_subject)
    db.commit()
    return {"message": "Subject deleted"}

# -- TEACHERS --
@router.post("/teachers")
def create_teacher(teacher_data: TeacherCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    if db.query(User).filter(User.username == teacher_data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = User(
        username=teacher_data.username,
        hashed_password=get_password_hash(teacher_data.password),
        role=Role.TEACHER
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    new_teacher = Teacher(user_id=new_user.id, name=teacher_data.name)
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    
    return {"message": "Teacher created successfully", "teacher_id": new_teacher.id}

@router.get("/teachers")
def get_teachers(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    teachers = db.query(Teacher).all()
    return [{"id": t.id, "user_id": t.user_id, "name": t.name, "username": t.user.username} for t in teachers]

@router.delete("/teachers/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
        
    for a in db_teacher.assignments:
        for s in a.sessions:
            db.query(AttendanceLog).filter(AttendanceLog.session_id == s.id).delete()
            db.delete(s)
        db.delete(a)
        
    user = db_teacher.user
    db.delete(db_teacher)
    if user: db.delete(user)
    
    db.commit()
    return {"message": "Teacher deleted"}

# -- STUDENTS --
@router.post("/students/onboard")
async def onboard_student(
    name: str = Form(...),
    roll_number: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    class_id: int = Form(...),
    images: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    if len(images) != 3:
        raise HTTPException(status_code=400, detail="Exactly 3 images are required for onboarding.")
    
    if db.query(Student).filter(Student.roll_number == roll_number).first():
        raise HTTPException(status_code=400, detail="Student with this roll number already exists.")
        
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already exists.")

    if not db.query(ClassGroup).filter(ClassGroup.id == class_id).first():
        raise HTTPException(status_code=404, detail="Class not found.")

    embeddings = []
    for img in images:
        content = await img.read()
        results = extract_faces_and_embeddings(content)
        if not results:
            raise HTTPException(status_code=400, detail=f"No face detected in one of the images ({img.filename}).")
        if len(results) > 1:
            raise HTTPException(status_code=400, detail=f"Multiple faces detected in image ({img.filename}). Only the student's face should be visible.")
        
        embeddings.append(results[0]['embedding'])
    
    avg_embedding = get_average_embedding(embeddings)
    
    # Create User
    new_user = User(
        username=username,
        hashed_password=get_password_hash(password),
        role=Role.STUDENT
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create Student
    new_student = Student(
        user_id=new_user.id,
        class_id=class_id,
        name=name,
        roll_number=roll_number,
        face_embedding=avg_embedding
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    return {"message": "Student onboarded successfully", "student_id": new_student.id}

@router.get("/students")
def get_students(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    students = db.query(Student).options(joinedload(Student.class_group)).all()
    return [{
        "id": s.id, 
        "user_id": s.user_id,
        "name": s.name, 
        "roll_number": s.roll_number,
        "username": s.user.username,
        "class_name": s.class_group.name if s.class_group else None
    } for s in students]

@router.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    db.query(AttendanceLog).filter(AttendanceLog.student_id == db_student.id).delete()
    user = db_student.user
    db.delete(db_student)
    if user: db.delete(user)
    
    db.commit()
    return {"message": "Student deleted"}

# -- ASSIGNMENTS --
@router.post("/assignments")
def assign_teacher(assignment: TeacherAssignmentCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_assignment = TeacherAssignment(
        teacher_id=assignment.teacher_id,
        class_id=assignment.class_id,
        subject_id=assignment.subject_id
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.get("/assignments")
def get_assignments(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    assignments = db.query(TeacherAssignment).options(joinedload(TeacherAssignment.teacher), joinedload(TeacherAssignment.class_group), joinedload(TeacherAssignment.subject)).all()
    return [{
        "id": a.id,
        "teacher": a.teacher.name,
        "class_name": a.class_group.name,
        "subject": f"{a.subject.name} ({a.subject.code})"
    } for a in assignments]

@router.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_assignment = db.query(TeacherAssignment).filter(TeacherAssignment.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    for s in db_assignment.sessions:
        db.query(AttendanceLog).filter(AttendanceLog.session_id == s.id).delete()
        db.delete(s)
        
    db.delete(db_assignment)
    db.commit()
    return {"message": "Assignment deleted"}
