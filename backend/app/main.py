from fastapi import FastAPI, HTTPException, Depends, Security, Form, File, UploadFile
from sqlalchemy.orm import Session
from . import models, schemas
from .database import SessionLocal, engine
from .firebase_auth import verify_token
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from datetime import datetime

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health", response_model=dict)
async def health_check():
    return {"status": "healthy"}

@app.post("/project-leaders/", response_model=schemas.ProjectLeader)
async def create_project_leader(
    project_leader: schemas.ProjectLeaderCreate,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    try:
        # Check if user already exists
        existing_user = db.query(models.User).filter(
            models.User.firebase_uid == project_leader.user.firebase_uid
        ).first()

        if existing_user:
            # Update existing user
            for key, value in project_leader.user.dict().items():
                setattr(existing_user, key, value)
            db_user = existing_user
        else:
            # Create new user
            db_user = models.User(**project_leader.user.dict())
            db.add(db_user)

        db.commit()
        db.refresh(db_user)

        # Check if project leader already exists
        db_project_leader = db.query(models.ProjectLeader).filter(
            models.ProjectLeader.user_id == db_user.id
        ).first()

        if not db_project_leader:
            db_project_leader = models.ProjectLeader(user_id=db_user.id)
            db.add(db_project_leader)

        # Update skills
        skills = db.query(models.Skill).filter(
            models.Skill.id.in_(project_leader.skill_ids)
        ).all()
        db_project_leader.skills = skills

        db.commit()
        db.refresh(db_project_leader)
        return db_project_leader

    except Exception as e:
        print("Error creating/updating project leader:", str(e))
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/skills/", response_model=schemas.Skill)
async def create_skill(
    skill: schemas.SkillCreate,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    # You can access user info from token
    # token['uid'] contains Firebase UID
    db_skill = models.Skill(**skill.dict())
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill

@app.post("/subcontractors/", response_model=schemas.Subcontractor)
async def create_subcontractor(
    subcontractor: schemas.SubcontractorCreate,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    try:
        # Verify that the Firebase UID matches
        if token['uid'] != subcontractor.user.firebase_uid:
            raise HTTPException(status_code=403, detail="Unauthorized")

        print("Received subcontractor data:", subcontractor.dict())

        # Check if user already exists
        existing_user = db.query(models.User).filter(
            models.User.firebase_uid == subcontractor.user.firebase_uid
        ).first()

        if existing_user:
            # Update existing user
            for key, value in subcontractor.user.dict().items():
                setattr(existing_user, key, value)
            db_user = existing_user
        else:
            # Create new user
            db_user = models.User(**subcontractor.user.dict())
            db.add(db_user)

        db.commit()
        db.refresh(db_user)

        # Check if subcontractor already exists
        db_subcontractor = db.query(models.Subcontractor).filter(
            models.Subcontractor.user_id == db_user.id
        ).first()

        if not db_subcontractor:
            db_subcontractor = models.Subcontractor(
                user_id=db_user.id,
                hourly_rate=subcontractor.hourly_rate,
                has_insurance=subcontractor.has_insurance
            )
            db.add(db_subcontractor)

        else:
            # Update existing subcontractor
            db_subcontractor.hourly_rate = subcontractor.hourly_rate
            db_subcontractor.has_insurance = subcontractor.has_insurance

        # Update skills
        skills = db.query(models.Skill).filter(
            models.Skill.id.in_(subcontractor.skill_ids)
        ).all()
        db_subcontractor.skills = skills

        db.commit()
        db.refresh(db_subcontractor)
        return db_subcontractor

    except Exception as e:
        print("Error creating/updating subcontractor:", str(e))
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: {str(e)}"
        )

@app.on_event("startup")
async def startup_db_client():
    # Create database tables
    models.Base.metadata.create_all(bind=engine)

    # Add default skills if they don't exist
    db = SessionLocal()
    try:
        # Check if skills exist
        existing_skills = db.query(models.Skill).all()
        skill_names = [skill.name for skill in existing_skills]

        # Define default skills
        default_skills = [
            {"name": "Plumbing", "description": "Installation and repair of pipes and fixtures"},
            {"name": "Electrical", "description": "Electrical system installation and repair"},
            {"name": "Carpentry", "description": "Woodworking and structural work"},
            {"name": "Painting", "description": "Interior and exterior painting"},
            {"name": "HVAC", "description": "Heating, ventilation, and air conditioning"},
            {"name": "Drywall", "description": "Drywall installation and repair"},
            {"name": "Landscaping", "description": "Outdoor landscape design and maintenance"},
            {"name": "Roofing", "description": "Roof installation and repair"},
            {"name": "Tiling", "description": "Tile installation for floors and walls"},
            {"name": "General Maintenance", "description": "General property maintenance and repairs"},
            {"name": "Insulation", "description": "Installation of thermal insulation"},
            {"name": "Gutters", "description": "Gutter installation and maintenance"},
        ]

        # Add skills that don't exist
        for skill in default_skills:
            if skill["name"] not in skill_names:
                db_skill = models.Skill(name=skill["name"], description=skill["description"])
                db.add(db_skill)

        db.commit()
    except Exception as e:
        print(f"Error adding default skills: {e}")
    finally:
        db.close()

@app.get("/users/profile", response_model=schemas.UserProfile)
async def get_user_profile(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    user = db.query(models.User).filter(models.User.firebase_uid == token['uid']).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get additional profile info based on user type
    profile_data = {
        "user_id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "company_name": user.company_name,
        "user_type": user.user_type,
        "location": user.location,
        "hourly_rate": None
    }

    # Add hourly rate for subcontractors
    if user.user_type == "SUBCONTRACTOR":
        subcontractor = db.query(models.Subcontractor).filter(
            models.Subcontractor.user_id == user.id
        ).first()
        if subcontractor:
            profile_data["hourly_rate"] = subcontractor.hourly_rate

    return profile_data

@app.put("/users/profile", response_model=schemas.UserProfile)
async def update_user_profile(
    profile_update: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    user = db.query(models.User).filter(models.User.firebase_uid == token['uid']).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update user location
    user.location = profile_update.location

    # Update hourly rate for subcontractors
    if user.user_type == "SUBCONTRACTOR" and profile_update.hourly_rate is not None:
        subcontractor = db.query(models.Subcontractor).filter(
            models.Subcontractor.user_id == user.id
        ).first()
        if subcontractor:
            subcontractor.hourly_rate = profile_update.hourly_rate

    db.commit()

    # Return updated profile
    return {
        "user_id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "company_name": user.company_name,
        "user_type": user.user_type,
        "location": user.location,
        "hourly_rate": subcontractor.hourly_rate if user.user_type == "SUBCONTRACTOR" and 'subcontractor' in locals() else None
    }

@app.post("/projects", response_model=schemas.Project)
async def create_project(
    title: str = Form(...),
    description: str = Form(None),
    location: str = Form(None),
    status: str = Form(...),
    images: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    # Check if user exists and is a project leader
    user = db.query(models.User).filter(models.User.firebase_uid == token['uid']).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.user_type != "PROJECT_LEADER":
        raise HTTPException(status_code=403, detail="Only project leaders can create projects")

    # Create project
    new_project = models.Project(
        title=title,
        description=description,
        location=location,
        status=status,
        project_leader_id=user.id,
        created_by=user.id,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # Handle image uploads
    image_urls = []
    for image in images:
        # Generate a unique filename
        filename = f"{new_project.id}_{uuid.uuid4()}{os.path.splitext(image.filename)[1]}"

        # Save the file
        file_path = os.path.join("uploads", filename)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        with open(file_path, "wb") as buffer:
            buffer.write(await image.read())

        # Create image record
        image_url = f"/uploads/{filename}"
        db_image = models.ProjectImage(
            project_id=new_project.id,
            image_url=image_url
        )
        db.add(db_image)
        image_urls.append(image_url)

    if image_urls:
        db.commit()

    # Return project with images
    return {
        "id": new_project.id,
        "title": new_project.title,
        "description": new_project.description,
        "location": new_project.location,
        "status": new_project.status,
        "project_leader_id": new_project.project_leader_id,
        "created_at": new_project.created_at,
        "updated_at": new_project.updated_at,
        "images": image_urls
    }

# Similar updates for other endpoints...