# backend/app/api/analysis.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services import openai_service
from app.models.user import User

router = APIRouter()

@router.post("/analyze/text")
async def analyze_text(text: str, user_id: int, db: Session = Depends(get_db)):
    try:
        # Get user data for context
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Analyze text with OpenAI
        analysis_result = await openai_service.OpenAIService.analyze_text(
            text, 
            context=f"User: {user.full_name}, Traits: {user.trait_scores}"
        )
        
        # Update user traits (weighted average with previous scores)
        if user.trait_scores and analysis_result.get('trait_scores'):
            # This would be a more sophisticated merging algorithm
            for trait, score in analysis_result['trait_scores'].items():
                if trait in user.trait_scores:
                    user.trait_scores[trait] = (user.trait_scores[trait] + score) / 2
                else:
                    user.trait_scores[trait] = score
        else:
            user.trait_scores = analysis_result.get('trait_scores', {})
        
        db.commit()
        
        return {
            "success": True,
            "analysis": analysis_result,
            "updated_traits": user.trait_scores
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
