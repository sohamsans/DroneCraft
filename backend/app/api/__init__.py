"""
API package for DroneCraft.
"""

from fastapi import APIRouter
from app.api.parts import router as parts_router
from app.api.simulate import router as simulate_router
from app.api.diagnose import router as diagnose_router
from app.api.optimize import router as optimize_router
from app.api.export import router as export_router

api_router = APIRouter()
api_router.include_router(parts_router)
api_router.include_router(simulate_router)
api_router.include_router(diagnose_router)
api_router.include_router(optimize_router)
api_router.include_router(export_router)

__all__ = ["api_router"]
