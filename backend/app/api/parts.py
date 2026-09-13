"""
Parts Catalog API Endpoints for DroneCraft.
Supports CRUD operations, filtering, and search for all 5 powertrain categories.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import (
    FrameModel,
    MotorModel,
    PropellerModel,
    EscModel,
    BatteryModelDB
)
from app.models.pydantic_models import (
    FrameBase, FrameResponse,
    MotorBase, MotorResponse,
    PropellerBase, PropellerResponse,
    EscBase, EscResponse,
    BatteryBase, BatteryResponse,
    ApiResponse
)

router = APIRouter(prefix="/parts", tags=["Parts Catalog"])

MODEL_MAP = {
    "frames": FrameModel,
    "motors": MotorModel,
    "propellers": PropellerModel,
    "escs": EscModel,
    "batteries": BatteryModelDB,
}


@router.get("/all")
def get_all_catalog_parts(db: Session = Depends(get_db)):
    """Returns complete component library categorized."""
    return {
        "frames": [f.to_dict() for f in db.query(FrameModel).all()],
        "motors": [m.to_dict() for m in db.query(MotorModel).all()],
        "propellers": [p.to_dict() for p in db.query(PropellerModel).all()],
        "escs": [e.to_dict() for e in db.query(EscModel).all()],
        "batteries": [b.to_dict() for b in db.query(BatteryModelDB).all()],
    }


@router.get("/{category}")
def list_parts(
    category: str,
    search: Optional[str] = Query(None, description="Search term for model/manufacturer"),
    db: Session = Depends(get_db)
):
    cat = category.lower()
    if cat not in MODEL_MAP:
        raise HTTPException(status_code=404, detail=f"Category '{category}' not found. Valid: frames, motors, propellers, escs, batteries")

    model_cls = MODEL_MAP[cat]
    query = db.query(model_cls)

    if search:
        search_pattern = f"%{search}%"
        if hasattr(model_cls, "name"):
            query = query.filter(model_cls.name.ilike(search_pattern) | model_cls.manufacturer.ilike(search_pattern))
        elif hasattr(model_cls, "model"):
            if hasattr(model_cls, "manufacturer"):
                query = query.filter(model_cls.model.ilike(search_pattern) | model_cls.manufacturer.ilike(search_pattern))
            elif hasattr(model_cls, "brand"):
                query = query.filter(model_cls.model.ilike(search_pattern) | model_cls.brand.ilike(search_pattern))

    records = query.all()
    return {"category": cat, "count": len(records), "data": [r.to_dict() for r in records]}


@router.get("/{category}/{part_id}")
def get_part_detail(category: str, part_id: int, db: Session = Depends(get_db)):
    cat = category.lower()
    if cat not in MODEL_MAP:
        raise HTTPException(status_code=404, detail="Invalid category")

    model_cls = MODEL_MAP[cat]
    record = db.query(model_cls).filter(model_cls.id == part_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"{category.capitalize()} with ID {part_id} not found")
    return record.to_dict()


@router.post("/{category}")
def create_custom_part(category: str, part_data: dict, db: Session = Depends(get_db)):
    cat = category.lower()
    if cat not in MODEL_MAP:
        raise HTTPException(status_code=400, detail="Invalid category")

    model_cls = MODEL_MAP[cat]
    # Remove id if provided
    part_data.pop("id", None)
    
    new_record = model_cls(**part_data)
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return {"success": True, "created": new_record.to_dict()}


@router.delete("/{category}/{part_id}")
def delete_part(category: str, part_id: int, db: Session = Depends(get_db)):
    cat = category.lower()
    if cat not in MODEL_MAP:
        raise HTTPException(status_code=400, detail="Invalid category")

    model_cls = MODEL_MAP[cat]
    record = db.query(model_cls).filter(model_cls.id == part_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Part not found")

    db.delete(record)
    db.commit()
    return {"success": True, "message": f"{category.capitalize()} {part_id} deleted successfully"}
