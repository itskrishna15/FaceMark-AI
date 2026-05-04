from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from backend.app.db.database import get_db
from backend.app.db.models import Student, ClassSession, AttendanceLog
from backend.app.services.face_engine import extract_faces_and_embeddings, get_average_embedding

router = APIRouter()

@router.post("/students/onboard")
async def onboard_student(
    name: str = Form(...),
    roll_number: str = Form(...),
    images: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    if len(images) != 3:
        raise HTTPException(status_code=400, detail="Exactly 3 images are required for onboarding.")
    
    # Check if student exists
    existing = db.query(Student).filter(Student.roll_number == roll_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student with this roll number already exists.")

    embeddings = []
    for img in images:
        content = await img.read()
        results = extract_faces_and_embeddings(content)
        if not results:
            raise HTTPException(status_code=400, detail=f"No face detected in one of the images ({img.filename}).")
        if len(results) > 1:
            raise HTTPException(status_code=400, detail=f"Multiple faces detected in image ({img.filename}). Only the student's face should be visible.")
        
        embeddings.append(results[0]['embedding'])
    
    # Average the 3 embeddings
    avg_embedding = get_average_embedding(embeddings)
    
    # Save to db
    new_student = Student(
        name=name,
        roll_number=roll_number,
        face_embedding=avg_embedding
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    return {"message": "Student onboarded successfully", "student_id": new_student.id}


@router.post("/attendance/mark")
async def mark_attendance(
    class_name: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    content = await image.read()
    results = extract_faces_and_embeddings(content)
    
    if not results:
        raise HTTPException(status_code=400, detail="No faces detected in the group image.")
    
    # Create class session
    new_class = ClassSession(name=class_name)
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    
    recognized_students = []
    
    # Define a similarity threshold (Cosine distance)
    # Cosine distance = 1 - Cosine similarity. pgvector `<=>` is cosine distance.
    # Lower is better. A threshold of 0.4 to 0.5 is usually good for ArcFace.
    SIMILARITY_THRESHOLD = 0.45
    
    for face in results:
        embedding = face['embedding']
        
        # pgvector query: Find nearest neighbor
        # Note: the embedding vector must be formatted as a string list for raw SQL or passed as a parameter
        # We can use SQLAlchemy ORM with pgvector's l2_distance or cosine_distance
        
        closest_student = db.query(Student).order_by(Student.face_embedding.cosine_distance(embedding)).first()
        
        if closest_student:
            # We need to calculate the actual distance to check against threshold
            # Since we just ordered by it, we can query the distance explicitly
            distance_query = db.query(Student.face_embedding.cosine_distance(embedding).label('distance')).filter(Student.id == closest_student.id).first()
            distance = distance_query.distance
            
            if distance <= SIMILARITY_THRESHOLD:
                # Face matched!
                confidence = 1.0 - distance
                
                # Check if already marked for this class
                existing_log = db.query(AttendanceLog).filter_by(student_id=closest_student.id, class_id=new_class.id).first()
                if not existing_log:
                    log = AttendanceLog(
                        student_id=closest_student.id,
                        class_id=new_class.id,
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
        "class_id": new_class.id,
        "recognized_count": len(recognized_students),
        "total_faces_detected": len(results),
        "students": recognized_students
    }


@router.get("/analytics/dashboard")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    total_students = db.query(Student).count()
    total_classes = db.query(ClassSession).count()
    total_attendance_logs = db.query(AttendanceLog).count()
    
    # Recent classes
    recent_classes = db.query(ClassSession).order_by(ClassSession.timestamp.desc()).limit(5).all()
    
    return {
        "total_students": total_students,
        "total_classes": total_classes,
        "total_attendance_logs": total_attendance_logs,
        "recent_classes": [
            {"id": c.id, "name": c.name, "timestamp": c.timestamp} for c in recent_classes
        ]
    }
