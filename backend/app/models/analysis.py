# backend/app/models/analysis.py
from sqlalchemy import Column, Integer, String, DateTime, JSON, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class VoiceAnalysis(Base):
    __tablename__ = "voice_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    audio_s3_key = Column(String, nullable=False)
    transcription = Column(String, nullable=True)
    emotional_fluency = Column(JSON, default={})
    tone_analysis = Column(JSON, default={})
    overall_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")

class TextAnalysis(Base):
    __tablename__ = "text_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    text_content = Column(String, nullable=False)
    trait_scores = Column(JSON, default={})
    suggestions = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")

class CompatibilityMatch(Base):
    __tablename__ = "compatibility_matches"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id_1 = Column(Integer, ForeignKey("users.id"))
    user_id_2 = Column(Integer, ForeignKey("users.id"))
    compatibility_score = Column(Float, nullable=False)
    analysis_summary = Column(String, nullable=True)
    matching_factors = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
