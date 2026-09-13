"""
Multi-Objective Genetic Optimizer API Route for DroneCraft.
Evolves drone configurations across catalog parts to find Pareto-optimal builds.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import (
    FrameModel,
    MotorModel,
    PropellerModel,
    EscModel,
    BatteryModelDB
)
from app.models.pydantic_models import OptimizeRequest
from app.optimizer.nsga2_optimizer import DroneOptimizerNSGA2

router = APIRouter(prefix="/optimize", tags=["Genetic Optimizer"])


@router.post("")
def run_genetic_optimizer(req: OptimizeRequest, db: Session = Depends(get_db)):
    """
    Runs NSGA-II multi-objective genetic algorithm on catalog parts.
    """
    frames = [f.to_dict() for f in db.query(FrameModel).all()]
    motors = [m.to_dict() for m in db.query(MotorModel).all()]
    props = [p.to_dict() for p in db.query(PropellerModel).all()]
    escs = [e.to_dict() for e in db.query(EscModel).all()]
    batteries = [b.to_dict() for b in db.query(BatteryModelDB).all()]

    if not all([frames, motors, props, escs, batteries]):
        raise HTTPException(status_code=400, detail="Catalog database does not contain sufficient components for optimization.")

    optimizer = DroneOptimizerNSGA2(
        frames=frames,
        motors=motors,
        props=props,
        escs=escs,
        batteries=batteries,
        payload_g=req.payload_g,
        target_flight_time_min=req.target_flight_time_min,
        max_budget_usd=req.max_budget_usd,
        frame_type_filter=req.frame_type_filter,
        min_twr=req.min_twr or 1.8,
        pop_size=req.population_size or 80,
        generations=req.generations or 30
    )

    try:
        results = optimizer.run_optimization()
        return {"success": True, "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")
