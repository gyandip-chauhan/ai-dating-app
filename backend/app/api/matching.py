# backend/app/api/matching.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.db.session import get_db
from app.models.user import User
from app.models.analysis import VoiceAnalysis, TextAnalysis, CompatibilityMatch
from app.services import openai_service

router = APIRouter()

@router.get("/matches/{user_id}", response_model=List[dict])
async def get_matches(
    user_id: int, 
    max_distance: Optional[int] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    interests: Optional[List[str]] = None,
    db: Session = Depends(get_db)
):
    """
    Get potential matches for a user based on compatibility analysis with filters
    """
    try:
        # Get current user
        current_user = db.query(User).filter(User.id == user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Build query with filters
        query = db.query(User).filter(User.id != user_id, User.is_active == True)
        
        # Apply filters
        if min_age is not None:
            query = query.filter(User.age >= min_age)
        if max_age is not None:
            query = query.filter(User.age <= max_age)
        if interests:
            # This would require a more sophisticated approach in a real implementation
            pass
        
        all_users = query.all()
        matches = []
        
        for user in all_users:
            # Calculate compatibility based on available data
            compatibility_score = calculate_compatibility(current_user, user, db)
            
            # Get user's latest text analysis for interests (if available)
            user_interests = get_user_interests(user.id, db)
            
            matches.append({
                "user_id": user.id,
                "name": user.full_name,
                "age": user.age,
                "gender": user.gender,
                "location": user.location,
                "bio": user.bio,
                "profile_picture": user.profile_picture,
                "compatibility_score": compatibility_score,
                "interests": user_interests[:3] if user_interests else []
            })
        
        # Sort by compatibility score (highest first)
        matches.sort(key=lambda x: x["compatibility_score"], reverse=True)
        
        return matches[:20]  # Return top 20 matches
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def calculate_compatibility(user1: User, user2: User, db: Session) -> float:
    score = 0.0
    
    score += calculate_demographic_compatibility(user1, user2)
    score += calculate_personality_compatibility(user1.id, user2.id, db)
    
    return min(score, 1.0)

def calculate_demographic_compatibility(user1: User, user2: User) -> float:
    score = 0.0
    
    if user1.age and user2.age:
        age_diff = abs(user1.age - user2.age)
        if age_diff <= 5:
            score += 0.3
        elif age_diff <= 10:
            score += 0.15
    
    if user1.location and user2.location and user1.location.lower() == user2.location.lower():
        score += 0.2
    
    if user1.gender and user2.gender and user1.gender.lower() == user2.gender.lower():
        score += 0.1
    
    return score

def calculate_personality_compatibility(user_id1: int, user_id2: int, db: Session) -> float:
    score = 0.0
    
    text_analysis1 = get_latest_text_analysis(user_id1, db)
    text_analysis2 = get_latest_text_analysis(user_id2, db)
    
    if text_analysis1 and text_analysis2:
        traits1 = text_analysis1.trait_scores or {}
        traits2 = text_analysis2.trait_scores or {}
        
        common_traits = set(traits1.keys()) & set(traits2.keys())
        for trait in common_traits:
            diff = abs(traits1[trait] - traits2[trait])
            score += (1 - diff) * 0.1
    
    return min(score, 0.5)

def get_latest_text_analysis(user_id: int, db: Session) -> Optional[TextAnalysis]:
    return db.query(TextAnalysis)\
        .filter(TextAnalysis.user_id == user_id)\
        .order_by(TextAnalysis.created_at.desc())\
        .first()

def get_user_interests(user_id: int, db: Session) -> List[str]:
    text_analysis = get_latest_text_analysis(user_id, db)
    if text_analysis and text_analysis.trait_scores:
        traits = text_analysis.trait_scores
        sorted_traits = sorted(traits.items(), key=lambda x: x[1], reverse=True)
        return [trait[0] for trait in sorted_traits[:5]]
    return []

@router.post("/matches/{user_id}/like/{target_user_id}")
async def like_user(user_id: int, target_user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        target_user = db.query(User).filter(User.id == target_user_id).first()
        
        if not user or not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        compatibility_score = calculate_compatibility(user, target_user, db)
        
        match_record = CompatibilityMatch(
            user_id_1=user_id,
            user_id_2=target_user_id,
            compatibility_score=compatibility_score,
            analysis_summary=f"Match between user {user_id} and {target_user_id}",
            matching_factors={"score": compatibility_score}
        )
        
        db.add(match_record)
        db.commit()
        
        return {
            "message": f"User {user_id} liked user {target_user_id}",
            "match": False,
            "compatibility_score": compatibility_score
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/matches/{user_id}/mutual")
async def get_mutual_matches(user_id: int, db: Session = Depends(get_db)):
    try:
        mutual_matches = db.query(CompatibilityMatch)\
            .filter(
                (CompatibilityMatch.user_id_1 == user_id) | 
                (CompatibilityMatch.user_id_2 == user_id)
            )\
            .order_by(CompatibilityMatch.compatibility_score.desc())\
            .limit(10)\
            .all()
        
        results = []
        for match in mutual_matches:
            other_user_id = match.user_id_2 if match.user_id_1 == user_id else match.user_id_1
            other_user = db.query(User).filter(User.id == other_user_id).first()
            
            if other_user:
                results.append({
                    "user_id": other_user.id,
                    "name": other_user.full_name,
                    "compatibility_score": match.compatibility_score
                })
        
        return {"mutual_matches": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
