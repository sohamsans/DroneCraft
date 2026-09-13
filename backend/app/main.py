"""
FastAPI Application Entry Point for DroneCraft / AeroOptima.
"""

import sys
import os

# Ensure backend root directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Drone Configurator, Diagnostics Analyzer & Theoretical Optimizer API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Initializes the database schema and seeds initial parts library."""
    init_db()


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0"
    }


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} Backend API",
        "docs": "/docs",
        "endpoints": {
            "parts": "/api/parts",
            "simulate": "/api/simulate",
            "diagnose": "/api/diagnose",
            "optimize": "/api/optimize",
            "export": "/api/export/spec"
        }
    }


app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
