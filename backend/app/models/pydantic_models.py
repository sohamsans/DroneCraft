"""
Pydantic Validation Schemas for DroneCraft API.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


# --- Part Schemas ---
class FrameBase(BaseModel):
    name: str
    manufacturer: str
    wheelbase_mm: float = Field(..., gt=0)
    frame_type: str = "Quad-X"
    max_prop_size_inch: float = Field(..., gt=0)
    dry_weight_g: float = Field(..., gt=0)
    payload_volume_cm3: Optional[float] = 150.0
    price_usd: float = Field(..., ge=0)
    source_url: Optional[str] = ""
    image_url: Optional[str] = ""
    specs_json: Optional[Dict[str, Any]] = {}

class FrameResponse(FrameBase):
    id: int

class MotorBase(BaseModel):
    model: str
    manufacturer: str
    kv: float = Field(..., gt=0)
    stator_size: Optional[str] = "2207"
    internal_resistance_mohm: float = Field(..., gt=0)
    idle_current_a: float = Field(..., ge=0)
    max_continuous_current_a: float = Field(..., gt=0)
    max_power_w: float = Field(..., gt=0)
    recommended_voltage_s_min: int = Field(default=3, ge=1)
    recommended_voltage_s_max: int = Field(default=6, ge=1)
    weight_g: float = Field(..., gt=0)
    price_usd: float = Field(..., ge=0)
    source_url: Optional[str] = ""
    image_url: Optional[str] = ""
    thrust_table_json: Optional[List[Dict[str, Any]]] = []

class MotorResponse(MotorBase):
    id: int

class PropellerBase(BaseModel):
    model: str
    manufacturer: str
    diameter_inch: float = Field(..., gt=0)
    pitch_inch: float = Field(..., gt=0)
    blade_count: int = Field(default=3, ge=1, le=8)
    weight_g: float = Field(..., gt=0)
    ct_hover: Optional[float] = None
    cp_hover: Optional[float] = None
    material: Optional[str] = "Polycarbonate"
    price_usd: float = Field(..., ge=0)
    source_url: Optional[str] = ""
    image_url: Optional[str] = ""

class PropellerResponse(PropellerBase):
    id: int

class EscBase(BaseModel):
    model: str
    manufacturer: str
    continuous_current_a: float = Field(..., gt=0)
    burst_current_a: float = Field(..., gt=0)
    voltage_min_s: int = Field(default=3, ge=1)
    voltage_max_s: int = Field(default=6, ge=1)
    protocol: Optional[str] = "DShot600"
    form_factor: Optional[str] = "4-in-1"
    weight_g: float = Field(..., gt=0)
    price_usd: float = Field(..., ge=0)
    source_url: Optional[str] = ""
    image_url: Optional[str] = ""

class EscResponse(EscBase):
    id: int

class BatteryBase(BaseModel):
    brand: str
    model: str
    cell_chemistry: Optional[str] = "LiPo"
    cells_s: int = Field(..., ge=1, le=14)
    capacity_mah: float = Field(..., gt=0)
    c_rating_continuous: float = Field(..., gt=0)
    c_rating_burst: float = Field(..., gt=0)
    internal_resistance_cell_mohm: float = Field(default=4.5, gt=0)
    nominal_cell_voltage_v: float = Field(default=3.7, gt=0)
    weight_g: float = Field(..., gt=0)
    price_usd: float = Field(..., ge=0)
    source_url: Optional[str] = ""
    image_url: Optional[str] = ""

class BatteryResponse(BatteryBase):
    id: int


# --- Simulation & Diagnostics Request Schemas ---
class DroneBuildRequest(BaseModel):
    frame: FrameBase
    motor: MotorBase
    propeller: PropellerBase
    esc: EscBase
    battery: BatteryBase
    payload_weight_g: Optional[float] = 0.0
    avionics_weight_g: Optional[float] = 45.0
    avionics_power_w: Optional[float] = 5.0
    altitude_m: Optional[float] = 0.0
    temperature_c: Optional[float] = 20.0
    depth_of_discharge: Optional[float] = 0.80

class DroneBuildByIdRequest(BaseModel):
    frame_id: int
    motor_id: int
    prop_id: int
    esc_id: int
    battery_id: int
    payload_weight_g: Optional[float] = 0.0
    altitude_m: Optional[float] = 0.0
    temperature_c: Optional[float] = 20.0


# --- Optimization Request Schema ---
class OptimizeRequest(BaseModel):
    payload_g: float = Field(default=0.0, ge=0)
    target_flight_time_min: float = Field(default=12.0, ge=1)
    max_budget_usd: float = Field(default=500.0, ge=50)
    frame_type_filter: Optional[str] = None
    min_twr: Optional[float] = 1.8
    population_size: Optional[int] = 80
    generations: Optional[int] = 30


# --- Generic API Response ---
class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    error: Optional[str] = None
