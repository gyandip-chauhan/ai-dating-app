# backend/app/schemas/chat.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChatMessageCreate(BaseModel):
    session_id: int
    content: str

class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    sender_id: int
    message_content: str
    ai_analysis: Optional[dict] = None
    moderation_result: Optional[dict] = None
    is_flagged: bool
    created_at: datetime

    class Config:
        from_attributes = True
