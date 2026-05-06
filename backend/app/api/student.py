from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from backend.app.db.database import get_db
from backend.app.db.models import User, Student, AttendanceLog, ClassGroup
from backend.app.core.security import get_current_student

router = APIRouter()

@router.get("/dashboard")
def get_student_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    if not current_user.student_profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")
        
    student_id = current_user.student_profile.id
    
    attendance_logs = db.query(AttendanceLog).filter(AttendanceLog.student_id == student_id).order_by(AttendanceLog.timestamp.desc()).all()
    
    # Reload student to eager load class_group and its subjects
    student_with_relations = db.query(Student).options(
        joinedload(Student.class_group).joinedload(ClassGroup.subjects)
    ).filter(Student.id == student_id).first()
    
    class_group = student_with_relations.class_group if student_with_relations else None
    
    subjects = []
    if class_group and hasattr(class_group, 'subjects'):
        subjects = [{"id": s.id, "name": s.name, "code": s.code} for s in class_group.subjects]
    
    return {
        "student_name": current_user.student_profile.name,
        "roll_number": current_user.student_profile.roll_number,
        "class_name": class_group.name if class_group else None,
        "my_subjects": subjects,
        "recent_attendance": [{
            "id": log.id,
            "session_id": log.session_id,
            "subject": log.class_session.assignment.subject.name if log.class_session.assignment else "Unknown",
            "timestamp": log.timestamp,
            "confidence": log.confidence
        } for log in attendance_logs]
    }
