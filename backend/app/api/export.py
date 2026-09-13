"""
Build Specification & Export API Route for DroneCraft.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.models.pydantic_models import DroneBuildRequest
from app.physics.powertrain_solver import PowertrainSolver
from app.diagnostics.advisor import DiagnosticsAdvisor

router = APIRouter(prefix="/export", tags=["Build Export"])


@router.post("/spec")
def generate_spec_sheet(build: DroneBuildRequest):
    """
    Generates a structured technical spec sheet markdown and data object for a build.
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
            payload_weight_g=build.payload_weight_g
        )
        sim = solver.simulate()
        diag = DiagnosticsAdvisor.evaluate_build(frame_dict, motor_dict, prop_dict, esc_dict, battery_dict, sim)

        markdown_report = f"""# DroneCraft Engineering Spec Sheet: {frame_dict.get('name')} Build

## 1. Powertrain Summary
- **All-Up-Weight (AUW)**: {sim['mass']['auw_g']} g ({sim['mass']['auw_kg']} kg)
- **Thrust-to-Weight Ratio (TWR)**: {sim['max_performance']['twr']}:1
- **Hover Flight Time**: {sim['hover']['hover_flight_time_minutes']} minutes
- **Hover Throttle**: {sim['hover']['hover_throttle_pct']}%
- **Max Total Thrust**: {sim['max_performance']['max_total_thrust_g']} g ({sim['max_performance']['max_total_thrust_n']} N)
- **Hover Efficiency**: {sim['hover']['hover_efficiency_g_per_w']} g/W
- **Estimated Top Speed**: {sim['max_performance']['estimated_top_speed_kmh']} km/h
- **Total System Cost**: ${sim['financial']['total_cost_usd']}

## 2. Hardware Bill of Materials (BOM)
- **Frame**: {frame_dict.get('manufacturer')} {frame_dict.get('name')} ({frame_dict.get('wheelbase_mm')}mm, {frame_dict.get('dry_weight_g')}g)
- **Motors ({sim['mass']['num_rotors']}x)**: {motor_dict.get('manufacturer')} {motor_dict.get('model')} ({motor_dict.get('kv')} KV)
- **Propellers ({sim['mass']['num_rotors']}x)**: {prop_dict.get('manufacturer')} {prop_dict.get('model')} ({prop_dict.get('diameter_inch')}" x {prop_dict.get('pitch_inch')}")
- **ESC**: {esc_dict.get('manufacturer')} {esc_dict.get('model')} ({esc_dict.get('continuous_current_a')}A continuous)
- **Battery**: {battery_dict.get('brand')} {battery_dict.get('model')} ({battery_dict.get('cells_s')}S {battery_dict.get('capacity_mah')}mAh)

## 3. Diagnostic Audit & Safety Score
- **Safety / Health Score**: {diag['health_score']}/100 ({diag['status']})
- **Flight Ready**: {"YES" if diag['is_flight_ready'] else "NO - ACTION REQUIRED"}
"""
        return {
            "success": True,
            "markdown": markdown_report,
            "simulation": sim,
            "diagnostics": diag
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Export failed: {str(e)}")
