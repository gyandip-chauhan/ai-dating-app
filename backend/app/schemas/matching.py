# backend/app/schemas/matching.py
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime

class MatchRequest(BaseModel):
    user_id: int
    preferences: Dict[str, Any] = {}
    max_distance: Optional[float] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None

class MatchResponse(BaseModel):
    match_id: int
    user_id: int
    matched_user_id: int
    compatibility_score: float
    match_reasons: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

class MatchPreferences(BaseModel):
    interests: List[str] = []
    personality_traits: Dict[str, float] = {}
    dealbreakers: List[str] = []
    location_preferences: Optional[Dict[str, Any]] = None