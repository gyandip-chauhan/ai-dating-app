# backend/app/services/hive_service.py
import requests
from app.core.config import settings
from typing import Dict, Any, Optional

class HiveService:
    @staticmethod
    async def moderate_content(text: str, content_type: str = "text") -> Dict[str, Any]:
        """
        Send content to Hive API for moderation
        """
        if not settings.HIVE_API_KEY:
            # Fallback to basic moderation if Hive is not configured
            return await HiveService._basic_moderation_fallback(text)
        
        try:
            headers = {
                "Authorization": f"Token {settings.HIVE_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "data": {
                    "text": text
                },
                "tasks": ["classification"]
            }
            
            response = requests.post(
                "https://api.thehive.ai/api/v2/task/sync",
                headers=headers,
                json=payload,
                timeout=10
            )
            
            response.raise_for_status()
            result = response.json()
            
            return HiveService._parse_hive_response(result)
            
        except Exception as e:
            # Fallback if Hive API fails
            return await HiveService._basic_moderation_fallback(text)
    
    @staticmethod
    def _parse_hive_response(response: Dict) -> Dict[str, Any]:
        """
        Parse Hive API response into our standard format
        """
        try:
            status = response.get("status", [])
            if not status or status[0].get("status") != "completed":
                return {"error": "Hive API did not complete processing"}
            
            classifications = response.get("output", [{}])[0].get("classes", [])
            
            # Extract relevant categories
            categories = {}
            for cls in classifications:
                if cls.get("class") and cls.get("score"):
                    categories[cls["class"]] = cls["score"]
            
            # Determine if content should be flagged
            high_risk_categories = ["sexual_content", "self_harm", "violence", "hate_speech"]
            max_risk_score = max([categories.get(cat, 0) for cat in high_risk_categories])
            should_flag = max_risk_score > 0.7
            
            return {
                "categories": categories,
                "should_flag": should_flag,
                "max_risk_score": max_risk_score,
                "provider": "hive"
            }
            
        except Exception as e:
            return {"error": f"Failed to parse Hive response: {str(e)}"}
    
    @staticmethod
    async def _basic_moderation_fallback(text: str) -> Dict[str, Any]:
        """
        Basic moderation fallback when Hive is not available
        """
        # Simple keyword-based moderation as fallback
        high_risk_keywords = [
            "kill", "hurt", "suicide", "harm", "attack", 
            "hate", "racist", "sexist", "nazi", "terrorist"
        ]
        
        text_lower = text.lower()
        detected_categories = {}
        
        for keyword in high_risk_keywords:
            if keyword in text_lower:
                detected_categories[keyword] = 0.8  # Default high score
        
        should_flag = len(detected_categories) > 0
        
        return {
            "categories": detected_categories,
            "should_flag": should_flag,
            "max_risk_score": 0.8 if should_flag else 0,
            "provider": "fallback"
        }
