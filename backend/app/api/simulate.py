"""
Physics Simulation API Route for DroneCraft.
Computes BEMT aerodynamics, DC motor circuit, battery voltage sag, hover point, and max performance.
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
from app.models.pydantic_models import (
    DroneBuildRequest,
    DroneBuildByIdRequest
)
from app.physics.powertrain_solver import PowertrainSolver

router = APIRouter(prefix="/simulate", tags=["Physics Simulation"])


@router.post("")
def simulate_drone_build(build: DroneBuildRequest):
    """
    Executes high-fidelity powertrain physics simulation on provided components.
    """
    try:
        solver = PowertrainSolver(
            frame_data=build.frame.model_dump(),
            motor_data=build.motor.model_dump(),
            propeller_data=build.propeller.model_dump(),
            esc_data=build.esc.model_dump(),
            battery_data=build.battery.model_dump(),
            payload_weight_g=build.payload_weight_g,
            avionics_weight_g=build.avionics_weight_g,
            avionics_power_w=build.avionics_power_w,
            altitude_m=build.altitude_m,
            temperature_c=build.temperature_c,
            depth_of_discharge=build.depth_of_discharge
        )
        results = solver.simulate()
        return {"success": True, "data": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Simulation failed: {str(e)}")


@router.post("/by-ids")
def simulate_by_part_ids(req: DroneBuildByIdRequest, db: Session = Depends(get_db)):
    """
    Looks up parts by their database IDs and runs simulation.
    """
    frame = db.query(FrameModel).filter(FrameModel.id == req.frame_id).first()
    motor = db.query(MotorModel).filter(MotorModel.id == req.motor_id).first()
    prop = db.query(PropellerModel).filter(PropellerModel.id == req.prop_id).first()
    esc = db.query(EscModel).filter(EscModel.id == req.esc_id).first()
    battery = db.query(BatteryModelDB).filter(BatteryModelDB.id == req.battery_id).first()

    if not all([frame, motor, prop, esc, battery]):
        raise HTTPException(status_code=404, detail="One or more specified part IDs do not exist.")

    solver = PowertrainSolver(
        frame_data=frame.to_dict(),
        motor_data=motor.to_dict(),
        propeller_data=prop.to_dict(),
        esc_data=esc.to_dict(),
        battery_data=battery.to_dict(),
        payload_weight_g=req.payload_weight_g,
        altitude_m=req.altitude_m,
        temperature_c=req.temperature_c
    )
    results = solver.simulate()
    return {"success": True, "data": results}
