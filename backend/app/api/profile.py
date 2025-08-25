
# backend/app/api/profile.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter()

@router.get("/profile/validate-username")
async def validate_username(
    username: str = Query(..., description="Username to validate"),
    db: Session = Depends(get_db)
):
    try:
        # Check if username is already taken
        existing_user = db.query(User).filter(User.full_name.ilike(username)).first()
        
        return {
            "available": existing_user is None,
            "suggestions": []  # You could generate suggestions if username is taken
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/interests/search")
async def search_interests(
    q: str = Query(..., description="Search query for interests"),
    db: Session = Depends(get_db)
):
    try:
        # In a real implementation, you would search from a database of interests
        # For now, we'll return some mock data
        all_interests = [
            "hiking", "reading", "cooking", "traveling", "photography",
            "music", "art", "sports", "gaming", "movies", "technology",
            "science", "nature", "animals", "fitness", "yoga", "meditation",
            "dancing", "singing", "writing", "painting", "drawing", "sculpting",
            "coding", "gardening", "baking", "knitting", "sewing", "woodworking"
        ]
        
        matching_interests = [interest for interest in all_interests if q.lower() in interest.lower()]
        
        return {"interests": matching_interests[:10]}  # Limit to 10 results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/interests/suggested")
async def get_suggested_interests(db: Session = Depends(get_db)):
    try:
        # Return some popular interests as suggestions
        suggested_interests = [
            "hiking", "reading", "cooking", "traveling", "photography",
            "music", "art", "sports", "gaming", "movies"
        ]
        
        return {"interests": suggested_interests}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/interests/popular")
async def get_popular_interests(db: Session = Depends(get_db)):
    try:
        # Return currently popular interests
        popular_interests = [
            "hiking", "yoga", "meditation", "cooking", "traveling",
            "photography", "music", "art", "fitness", "technology"
        ]
        
        return {"interests": popular_interests}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
