from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.db.database import engine, Base

# Import all new routers
from backend.app.api.auth import router as auth_router
from backend.app.api.admin import router as admin_router
from backend.app.api.teacher import router as teacher_router
from backend.app.api.student import router as student_router

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FaceMark-AI Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
app.include_router(teacher_router, prefix="/api/teacher", tags=["teacher"])
app.include_router(student_router, prefix="/api/student", tags=["student"])

@app.get("/")
def root():
    return {"message": "FaceMark-AI API is running"}
