from pydantic import BaseModel, EmailStr
from typing import List, Optional
from enum import Enum
from datetime import datetime

class UserType(str, Enum):
    SUBCONTRACTOR = "SUBCONTRACTOR"
    PROJECT_LEADER = "PROJECT_LEADER"

class SkillBase(BaseModel):
    name: str
    description: Optional[str] = None

class SkillCreate(SkillBase):
    pass

class Skill(SkillBase):
    id: int

    class Config:
        orm_mode = True

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    company_name: Optional[str] = None
    user_type: UserType

class UserCreate(UserBase):
    firebase_uid: str

class User(UserBase):
    id: int
    firebase_uid: str

    class Config:
        orm_mode = True

class SubcontractorBase(BaseModel):
    hourly_rate: int
    has_insurance: bool

class SubcontractorCreate(SubcontractorBase):
    user: UserCreate
    skill_ids: List[int]

class Subcontractor(SubcontractorBase):
    id: int
    user: User
    skills: List[Skill]

    class Config:
        orm_mode = True

class ProjectLeaderBase(BaseModel):
    pass

class ProjectLeaderCreate(ProjectLeaderBase):
    user: UserCreate
    skill_ids: List[int]

class ProjectLeader(ProjectLeaderBase):
    id: int
    user: User
    skills: List[Skill]

    class Config:
        orm_mode = True

class UserProfileUpdate(BaseModel):
    location: Optional[str] = None
    hourly_rate: Optional[float] = None

class UserProfile(BaseModel):
    user_id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    company_name: Optional[str] = None
    user_type: str
    location: Optional[str] = None
    hourly_rate: Optional[float] = None

    class Config:
        orm_mode = True

class ProjectImage(BaseModel):
    id: int
    project_id: int
    image_url: str

    class Config:
        orm_mode = True

class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    status: str

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    project_leader_id: int
    created_at: datetime
    updated_at: datetime
    images: List[str] = []

    class Config:
        orm_mode = True