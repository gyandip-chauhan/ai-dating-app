# backend/app/schemas/auth.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from .user import UserResponse  # <-- import your User schema

class Token(BaseModel):
    token: str
    token_type: str
    user: Optional[UserResponse] = None  # use the proper User schema

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
