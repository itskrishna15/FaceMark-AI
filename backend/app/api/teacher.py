from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.db.database import get_db
from backend.app.db.models import User, Teacher, TeacherAssignment, ClassSession, AttendanceLog, Student
from backend.app.core.security import get_current_teacher
from backend.app.services.face_engine import extract_faces_and_embeddings

router = APIRouter()

@router.get("/assignments")
def get_teacher_assignments(db: Session = Depends(get_db), current_user: User = Depends(get_current_teacher)):
    if not current_user.teacher_profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found.")
    
    assignments = db.query(TeacherAssignment).filter(TeacherAssignment.teacher_id == current_user.teacher_profile.id).all()
    
    return [{
        "id": a.id,
        "class_name": a.class_group.name,
        "subject": a.subject.name
    } for a in assignments]

@router.post("/attendance/mark")
async def mark_attendance(
    assignment_id: int = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    assignment = db.query(TeacherAssignment).filter(
        TeacherAssignment.id == assignment_id, 
        TeacherAssignment.teacher_id == current_user.teacher_profile.id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=403, detail="Invalid assignment or not authorized.")

    content = await image.read()
    results = extract_faces_and_embeddings(content)
    
    if not results:
        raise HTTPException(status_code=400, detail="No faces detected in the group image.")
    
    new_session = ClassSession(assignment_id=assignment.id)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    recognized_students = []
    SIMILARITY_THRESHOLD = 0.45
    
    for face in results:
        embedding = face['embedding']
        
        # Only check students in this class
        closest_student = db.query(Student).filter(Student.class_id == assignment.class_id)\
                            .order_by(Student.face_embedding.cosine_distance(embedding)).first()
        
        if closest_student:
            distance_query = db.query(Student.face_embedding.cosine_distance(embedding).label('distance'))\
                               .filter(Student.id == closest_student.id).first()
            distance = distance_query.distance
            
            if distance <= SIMILARITY_THRESHOLD:
                confidence = 1.0 - distance
                
                existing_log = db.query(AttendanceLog).filter_by(student_id=closest_student.id, session_id=new_session.id).first()
                if not existing_log:
                    log = AttendanceLog(
                        student_id=closest_student.id,
                        session_id=new_session.id,
                        confidence=confidence
                    )
                    db.add(log)
                    recognized_students.append({
                        "id": closest_student.id,
                        "name": closest_student.name,
                        "roll_number": closest_student.roll_number,
                        "confidence": confidence
                    })
    
    db.commit()
    
    return {
        "message": "Attendance marked successfully.",
        "session_id": new_session.id,
        "recognized_count": len(recognized_students),
        "total_faces_detected": len(results),
        "students": recognized_students
    }

@router.get("/analytics")
def get_teacher_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_teacher)):
    teacher_id = current_user.teacher_profile.id
    
    sessions = db.query(ClassSession).join(TeacherAssignment).filter(TeacherAssignment.teacher_id == teacher_id)\
                 .order_by(ClassSession.timestamp.desc()).limit(10).all()
                 
    return {
        "recent_sessions": [{
            "id": s.id,
            "class_name": s.assignment.class_group.name,
            "subject": s.assignment.subject.name,
            "timestamp": s.timestamp,
            "attendance_count": len(s.attendance_logs)
        } for s in sessions]
    }
