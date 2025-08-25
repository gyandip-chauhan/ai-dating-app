# backend/app/main.py (updated)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import users, analysis, chat, matching, journal, notifications, profile
from app.db.session import engine
from app.models import user, analysis as analysis_models, chat as chat_models, journal as journal_models, notification as notification_models
from app.core.config import settings

# Create tables
user.Base.metadata.create_all(bind=engine)
analysis_models.Base.metadata.create_all(bind=engine)
chat_models.Base.metadata.create_all(bind=engine)
journal_models.Base.metadata.create_all(bind=engine)
notification_models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Dating App API", version="1.0.0")

# CORS middleware - UPDATED
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://192.168.31.151:3000", "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(analysis.router, prefix="/api", tags=["analysis"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(matching.router, prefix="/api", tags=["matching"])
app.include_router(journal.router, prefix="/api", tags=["journal"])
app.include_router(notifications.router, prefix="/api", tags=["notifications"])
app.include_router(profile.router, prefix="/api", tags=["profile"])

@app.get("/")
async def root():
    return {"message": "AI Dating App API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
