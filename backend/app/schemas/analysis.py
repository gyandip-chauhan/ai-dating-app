# backend/app/schemas/analysis.py
from pydantic import BaseModel
from typing import Dict, Any

class TextAnalysisRequest(BaseModel):
    text: str
    user_id: int

class TextAnalysisResponse(BaseModel):
    success: bool
    analysis: Dict[str, Any]
    updated_traits: Dict[str, float]
