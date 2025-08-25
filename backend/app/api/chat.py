# backend/app/api/chat.py (additional endpoints)
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.chat import ChatSession, ChatMessage
from app.models.user import User
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse
from app.core.security import get_current_user
import json

router = APIRouter()

# ... (your existing websocket and connection manager code remains)

@router.get("/chat/{session_id}/history")
async def get_chat_history(
    session_id: str, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Verify user has access to this chat session
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session or (session.user_id_1 != current_user.id and session.user_id_2 != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to access this chat session")
        
        # Get chat messages
        messages = db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.created_at.asc()).all()
        
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/sessions")
async def create_chat_session(
    user_id: int, 
    target_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to create chat session")
    
    try:
        # Check if session already exists
        existing_session = db.query(ChatSession).filter(
            ((ChatSession.user_id_1 == user_id) & (ChatSession.user_id_2 == target_user_id)) |
            ((ChatSession.user_id_1 == target_user_id) & (ChatSession.user_id_2 == user_id))
        ).first()
        
        if existing_session:
            return {"session_id": existing_session.id, "is_new": False}
        
        # Create new session
        new_session = ChatSession(
            user_id_1=user_id,
            user_id_2=target_user_id,
            is_active=True
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        return {"session_id": new_session.id, "is_new": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/user/{user_id}/sessions")
async def get_chat_sessions(
    user_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access these chat sessions")
    
    try:
        # Get all chat sessions for the user
        sessions = db.query(ChatSession).filter(
            (ChatSession.user_id_1 == user_id) | (ChatSession.user_id_2 == user_id),
            ChatSession.is_active == True
        ).all()
        
        # Format response with user details
        result = []
        for session in sessions:
            other_user_id = session.user_id_2 if session.user_id_1 == user_id else session.user_id_1
            other_user = db.query(User).filter(User.id == other_user_id).first()
            
            # Get last message
            last_message = db.query(ChatMessage).filter(
                ChatMessage.session_id == session.id
            ).order_by(ChatMessage.created_at.desc()).first()
            
            result.append({
                "session_id": session.id,
                "other_user_id": other_user_id,
                "other_user_name": other_user.full_name if other_user else "Unknown",
                "other_user_profile_picture": other_user.profile_picture if other_user else None,
                "last_message": last_message.message_content if last_message else None,
                "last_message_time": last_message.created_at if last_message else session.created_at,
                "unread_count": 0  # You would need to implement this
            })
        
        return {"sessions": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/{session_id}/read")
async def mark_as_read(
    session_id: str, 
    message_ids: List[str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Verify user has access to this chat session
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session or (session.user_id_1 != current_user.id and session.user_id_2 != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to access this chat session")
        
        # In a real implementation, you would update the read status of messages
        # For now, we'll just return success
        return {"message": "Messages marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/{session_id}/typing")
async def send_typing_indicator(
    session_id: str, 
    is_typing: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Verify user has access to this chat session
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session or (session.user_id_1 != current_user.id and session.user_id_2 != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to access this chat session")
        
        # In a real implementation, you would broadcast the typing indicator via WebSocket
        # For now, we'll just return success
        return {"message": "Typing indicator sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chat/sessions/{session_id}")
async def delete_chat_session(
    session_id: str, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Verify user has access to this chat session
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session or (session.user_id_1 != current_user.id and session.user_id_2 != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to delete this chat session")
        
        # Mark session as inactive instead of deleting
        session.is_active = False
        db.commit()
        
        return {"message": "Chat session deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chat/{session_id}/history")
async def clear_chat_history(
    session_id: str, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Verify user has access to this chat session
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session or (session.user_id_1 != current_user.id and session.user_id_2 != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to clear this chat history")
        
        # Delete all messages in the session
        db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
        db.commit()
        
        return {"message": "Chat history cleared"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
