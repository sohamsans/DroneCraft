"""
Diagnostics & Safety Audit API Route for DroneCraft.
Evaluates deterministic safety and performance rules.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.pydantic_models import DroneBuildRequest
from app.physics.powertrain_solver import PowertrainSolver
from app.diagnostics.advisor import DiagnosticsAdvisor

router = APIRouter(prefix="/diagnose", tags=["Diagnostics Engine"])


@router.post("")
def diagnose_drone_build(build: DroneBuildRequest):
    """
    Executes full physical simulation and deterministic diagnostic safety audit.
    """
    try:
        frame_dict = build.frame.model_dump()
        motor_dict = build.motor.model_dump()
        prop_dict = build.propeller.model_dump()
        esc_dict = build.esc.model_dump()
        battery_dict = build.battery.model_dump()

        solver = PowertrainSolver(
            frame_data=frame_dict,
            motor_data=motor_dict,
            propeller_data=prop_dict,
            esc_data=esc_dict,
            battery_data=battery_dict,
            payload_weight_g=build.payload_weight_g,
            altitude_m=build.altitude_m,
            temperature_c=build.temperature_c
        )
        sim_results = solver.simulate()

        diagnostics = DiagnosticsAdvisor.evaluate_build(
            frame=frame_dict,
            motor=motor_dict,
            prop=prop_dict,
            esc=esc_dict,
            battery=battery_dict,
            sim_results=sim_results
        )

        return {
            "success": True,
            "simulation": sim_results,
            "diagnostics": diagnostics
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Diagnostic analysis failed: {str(e)}")
