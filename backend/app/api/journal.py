# backend/app/api/journal.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.user import User
from app.models.journal import JournalEntry
from app.schemas.journal import JournalEntryCreate, JournalEntryResponse
from app.core.security import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/journal/{user_id}", response_model=List[JournalEntryResponse])
async def get_journal_entries(
    user_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access these journal entries")
    
    try:
        entries = db.query(JournalEntry).filter(
            JournalEntry.user_id == user_id
        ).order_by(JournalEntry.created_at.desc()).all()
        return entries
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/journal/{user_id}", response_model=JournalEntryResponse)
async def create_journal_entry(
    user_id: int, 
    entry_data: JournalEntryCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to create journal entries for this user")
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        new_entry = JournalEntry(
            user_id=user_id,
            content=entry_data.content,
            mood=entry_data.mood
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        return new_entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/journal/{user_id}/entries/{entry_id}", response_model=JournalEntryResponse)
async def update_journal_entry(
    user_id: int, 
    entry_id: int, 
    entry_data: JournalEntryCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this journal entry")
    
    try:
        entry = db.query(JournalEntry).filter(
            JournalEntry.id == entry_id, 
            JournalEntry.user_id == user_id
        ).first()
        
        if not entry:
            raise HTTPException(status_code=404, detail="Journal entry not found")
        
        entry.content = entry_data.content
        entry.mood = entry_data.mood
        
        db.commit()
        db.refresh(entry)
        return entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/journal/{user_id}/entries/{entry_id}")
async def delete_journal_entry(
    user_id: int, 
    entry_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this journal entry")
    
    try:
        entry = db.query(JournalEntry).filter(
            JournalEntry.id == entry_id, 
            JournalEntry.user_id == user_id
        ).first()
        
        if not entry:
            raise HTTPException(status_code=404, detail="Journal entry not found")
        
        db.delete(entry)
        db.commit()
        return {"message": "Journal entry deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/journal/{user_id}/analysis")
async def get_journal_analysis(
    user_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this analysis")
    
    try:
        # Get all journal entries for analysis
        entries = db.query(JournalEntry).filter(
            JournalEntry.user_id == user_id
        ).order_by(JournalEntry.created_at.desc()).all()
        
        # Simple analysis - count mood occurrences
        mood_counts = {}
        for entry in entries:
            mood_counts[entry.mood] = mood_counts.get(entry.mood, 0) + 1
        
        # Get most common mood
        most_common_mood = max(mood_counts.items(), key=lambda x: x[1])[0] if mood_counts else "neutral"
        
        return {
            "total_entries": len(entries),
            "mood_distribution": mood_counts,
            "most_common_mood": most_common_mood,
            "first_entry_date": entries[-1].created_at if entries else None,
            "last_entry_date": entries[0].created_at if entries else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/journal/{user_id}/insights")
async def get_journal_insights(
    user_id: int, 
    timeframe: str = "month",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access these insights")
    
    try:
        # Calculate date range based on timeframe
        end_date = datetime.utcnow()
        if timeframe == "week":
            start_date = end_date - timedelta(days=7)
        elif timeframe == "month":
            start_date = end_date - timedelta(days=30)
        else:  # default to month
            start_date = end_date - timedelta(days=30)
        
        # Get entries within the timeframe
        entries = db.query(JournalEntry).filter(
            JournalEntry.user_id == user_id,
            JournalEntry.created_at >= start_date,
            JournalEntry.created_at <= end_date
        ).order_by(JournalEntry.created_at.desc()).all()
        
        # Calculate insights
        mood_counts = {}
        for entry in entries:
            mood_counts[entry.mood] = mood_counts.get(entry.mood, 0) + 1
        
        # Calculate writing frequency
        if entries:
            days_with_entries = len(set(entry.created_at.date() for entry in entries))
            total_days = (end_date - start_date).days + 1
            writing_frequency = days_with_entries / total_days
        else:
            writing_frequency = 0
        
        return {
            "timeframe": timeframe,
            "total_entries": len(entries),
            "mood_distribution": mood_counts,
            "writing_frequency": writing_frequency,
            "average_entries_per_day": len(entries) / ((end_date - start_date).days + 1) if entries else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
