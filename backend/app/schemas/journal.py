from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class JournalEntryBase(BaseModel):
    content: str
    mood: str = "neutral"

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntryResponse(JournalEntryBase):
    id: int
    user_id: int
    analysis_result: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
