# backend/app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Float, Text
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Profile fields
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    location = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    profile_picture = Column(String, nullable=True)
    
    # Onboarding data
    onboarding_responses = Column(JSON, default={})
    preferences = Column(JSON, default={})
    
    # AI Analysis data
    trait_scores = Column(JSON, default={})
    emotional_badges = Column(JSON, default=[])
    last_analysis_date = Column(DateTime(timezone=True), nullable=True)
