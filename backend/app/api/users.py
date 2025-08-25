# backend/app/api/users.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.services import openai_service, s3_service
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()

@router.post("/auth/register", response_model=Token)
async def register(user_data: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        trait_scores={},
        emotional_badges=[]
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return {"token": access_token, "token_type": "bearer", "user": user}

@router.post("/auth/login", response_model=Token)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"token": access_token, "token_type": "bearer", "user": user}

@router.get("/users", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    users = db.query(User).filter(User.is_active == True).offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    update_data = user_data.dict(exclude_unset=True)
    if 'password' in update_data:
        update_data['hashed_password'] = get_password_hash(update_data.pop('password'))
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/{user_id}/profile-picture")
async def upload_profile_picture(
    user_id: int, 
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Upload to S3
    s3_service_instance = s3_service.S3Service()
    file_key = await s3_service_instance.upload_file(
        file.file, file.filename, file.content_type
    )
    
    if file_key:
        user.profile_picture = file_key
        db.commit()
        db.refresh(user)
        
        # Generate presigned URL
        presigned_url = await s3_service_instance.get_presigned_url(file_key)
        return {"profile_picture_url": presigned_url}
    
    raise HTTPException(status_code=500, detail="Failed to upload profile picture")

@router.post("/users/{user_id}/voice-analysis")
async def upload_voice_for_analysis(
    user_id: int, 
    audio_file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Upload to S3
    s3_service_instance = s3_service.S3Service()
    file_key = await s3_service_instance.upload_file(
        audio_file.file, audio_file.filename, audio_file.content_type
    )
    
    if file_key:
        # Analyze with OpenAI
        try:
            analysis_result = await openai_service.OpenAIService.analyze_voice(file_key)
            
            # Create voice analysis record (you'd need to import and use VoiceAnalysis model)
            # voice_analysis = VoiceAnalysis(
            #     user_id=user_id,
            #     audio_s3_key=file_key,
            #     **analysis_result
            # )
            # db.add(voice_analysis)
            # db.commit()
            
            return {
                "success": True,
                "analysis": analysis_result,
                "audio_url": await s3_service_instance.get_presigned_url(file_key)
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    
    raise HTTPException(status_code=500, detail="Failed to upload audio file")
