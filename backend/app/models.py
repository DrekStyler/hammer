from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Table, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from .schemas import UserType  # Import UserType from schemas instead of defining a new one

Base = declarative_base()

# Association tables for many-to-many relationships
subcontractor_skills = Table(
    'subcontractor_skills',
    Base.metadata,
    Column('subcontractor_id', Integer, ForeignKey('subcontractors.id')),
    Column('skill_id', Integer, ForeignKey('skills.id'))
)

project_leader_skills = Table(
    'project_leader_skills',
    Base.metadata,
    Column('project_leader_id', Integer, ForeignKey('project_leaders.id')),
    Column('skill_id', Integer, ForeignKey('skills.id'))
)

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    phone = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    user_type = Column(Enum(UserType))
    location = Column(String, nullable=True)

    # One-to-one relationship with either Subcontractor or ProjectLeader
    subcontractor = relationship("Subcontractor", back_populates="user", uselist=False)
    project_leader = relationship("ProjectLeader", back_populates="user", uselist=False)

class Skill(Base):
    __tablename__ = 'skills'

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String)

class Subcontractor(Base):
    __tablename__ = 'subcontractors'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    hourly_rate = Column(Integer)
    has_insurance = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="subcontractor")
    skills = relationship("Skill", secondary=subcontractor_skills)

class ProjectLeader(Base):
    __tablename__ = 'project_leaders'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)

    # Relationships
    user = relationship("User", back_populates="project_leader")
    skills = relationship("Skill", secondary=project_leader_skills)

class Project(Base):
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String)
    location = Column(String)
    status = Column(String, nullable=False)  # draft, published, in_progress, completed, cancelled
    project_leader_id = Column(Integer, ForeignKey('users.id'))
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)

    # Relationships
    project_leader = relationship("User", foreign_keys=[project_leader_id])
    images = relationship("ProjectImage", back_populates="project")

class ProjectImage(Base):
    __tablename__ = 'project_images'

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey('projects.id'))
    image_url = Column(String, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="images")