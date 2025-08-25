# backend/app/schemas/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    trait_scores: Optional[Dict[str, float]] = None
    emotional_badges: Optional[List[str]] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    trait_scores: Dict[str, float]
    emotional_badges: List[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
