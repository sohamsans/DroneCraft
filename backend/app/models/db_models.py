"""
SQLAlchemy Database Models for DroneCraft.
Includes tables for Frames, Motors, Propellers, ESCs, Batteries, and SavedBuilds.
Supports SQLite and PostgreSQL with JSON data types.
"""

import json
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, JSON
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class FrameModel(Base):
    __tablename__ = "frames"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False, index=True)
    manufacturer = Column(String(80), nullable=False, index=True)
    wheelbase_mm = Column(Float, nullable=False)
    frame_type = Column(String(50), default="Quad-X", index=True)  # Quad-X, Hex-X, Octo-X, Cinewhoop, Long-range
    max_prop_size_inch = Column(Float, nullable=False)
    dry_weight_g = Column(Float, nullable=False)
    payload_volume_cm3 = Column(Float, default=150.0)
    price_usd = Column(Float, nullable=False)
    source_url = Column(String(255), default="")
    image_url = Column(String(255), default="")
    specs_json = Column(JSON, default=dict)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "manufacturer": self.manufacturer,
            "wheelbase_mm": self.wheelbase_mm,
            "frame_type": self.frame_type,
            "max_prop_size_inch": self.max_prop_size_inch,
            "dry_weight_g": self.dry_weight_g,
            "payload_volume_cm3": self.payload_volume_cm3,
            "price_usd": self.price_usd,
            "source_url": self.source_url,
            "image_url": self.image_url,
            "specs_json": self.specs_json or {}
        }


class MotorModel(Base):
    __tablename__ = "motors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model = Column(String(120), nullable=False, index=True)
    manufacturer = Column(String(80), nullable=False, index=True)
    kv = Column(Float, nullable=False)
    stator_size = Column(String(50), default="2207")  # e.g., 2207, 2306, 1404, 2806, 4014
    internal_resistance_mohm = Column(Float, nullable=False)
    idle_current_a = Column(Float, default=0.8)
    max_continuous_current_a = Column(Float, nullable=False)
    max_power_w = Column(Float, nullable=False)
    recommended_voltage_s_min = Column(Integer, default=4)
    recommended_voltage_s_max = Column(Integer, default=6)
    weight_g = Column(Float, nullable=False)
    price_usd = Column(Float, nullable=False)
    source_url = Column(String(255), default="")
    image_url = Column(String(255), default="")
    thrust_table_json = Column(JSON, default=list)

    def to_dict(self):
        return {
            "id": self.id,
            "model": self.model,
            "manufacturer": self.manufacturer,
            "kv": self.kv,
            "stator_size": self.stator_size,
            "internal_resistance_mohm": self.internal_resistance_mohm,
            "idle_current_a": self.idle_current_a,
            "max_continuous_current_a": self.max_continuous_current_a,
            "max_power_w": self.max_power_w,
            "recommended_voltage_s_min": self.recommended_voltage_s_min,
            "recommended_voltage_s_max": self.recommended_voltage_s_max,
            "weight_g": self.weight_g,
            "price_usd": self.price_usd,
            "source_url": self.source_url,
            "image_url": self.image_url,
            "thrust_table_json": self.thrust_table_json or []
        }


class PropellerModel(Base):
    __tablename__ = "propellers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model = Column(String(120), nullable=False, index=True)
    manufacturer = Column(String(80), nullable=False, index=True)
    diameter_inch = Column(Float, nullable=False)
    pitch_inch = Column(Float, nullable=False)
    blade_count = Column(Integer, default=3)
    weight_g = Column(Float, nullable=False)
    ct_hover = Column(Float, nullable=True)
    cp_hover = Column(Float, nullable=True)
    material = Column(String(50), default="Polycarbonate")
    price_usd = Column(Float, nullable=False)
    source_url = Column(String(255), default="")
    image_url = Column(String(255), default="")

    def to_dict(self):
        return {
            "id": self.id,
            "model": self.model,
            "manufacturer": self.manufacturer,
            "diameter_inch": self.diameter_inch,
            "pitch_inch": self.pitch_inch,
            "blade_count": self.blade_count,
            "weight_g": self.weight_g,
            "ct_hover": self.ct_hover,
            "cp_hover": self.cp_hover,
            "material": self.material,
            "price_usd": self.price_usd,
            "source_url": self.source_url,
            "image_url": self.image_url
        }


class EscModel(Base):
    __tablename__ = "escs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model = Column(String(120), nullable=False, index=True)
    manufacturer = Column(String(80), nullable=False, index=True)
    continuous_current_a = Column(Float, nullable=False)
    burst_current_a = Column(Float, nullable=False)
    voltage_min_s = Column(Integer, default=3)
    voltage_max_s = Column(Integer, default=6)
    protocol = Column(String(50), default="DShot600")
    form_factor = Column(String(50), default="4-in-1")  # 4-in-1 or Individual
    weight_g = Column(Float, nullable=False)
    price_usd = Column(Float, nullable=False)
    source_url = Column(String(255), default="")
    image_url = Column(String(255), default="")

    def to_dict(self):
        return {
            "id": self.id,
            "model": self.model,
            "manufacturer": self.manufacturer,
            "continuous_current_a": self.continuous_current_a,
            "burst_current_a": self.burst_current_a,
            "voltage_min_s": self.voltage_min_s,
            "voltage_max_s": self.voltage_max_s,
            "protocol": self.protocol,
            "form_factor": self.form_factor,
            "weight_g": self.weight_g,
            "price_usd": self.price_usd,
            "source_url": self.source_url,
            "image_url": self.image_url
        }


class BatteryModelDB(Base):
    __tablename__ = "batteries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    brand = Column(String(80), nullable=False, index=True)
    model = Column(String(120), nullable=False)
    cell_chemistry = Column(String(50), default="LiPo")  # LiPo, Li-ion, LiHV
    cells_s = Column(Integer, nullable=False)
    capacity_mah = Column(Float, nullable=False)
    c_rating_continuous = Column(Float, nullable=False)
    c_rating_burst = Column(Float, nullable=False)
    internal_resistance_cell_mohm = Column(Float, default=4.5)
    nominal_cell_voltage_v = Column(Float, default=3.7)
    weight_g = Column(Float, nullable=False)
    price_usd = Column(Float, nullable=False)
    source_url = Column(String(255), default="")
    image_url = Column(String(255), default="")

    def to_dict(self):
        return {
            "id": self.id,
            "brand": self.brand,
            "model": self.model,
            "cell_chemistry": self.cell_chemistry,
            "cells_s": self.cells_s,
            "capacity_mah": self.capacity_mah,
            "c_rating_continuous": self.c_rating_continuous,
            "c_rating_burst": self.c_rating_burst,
            "internal_resistance_cell_mohm": self.internal_resistance_cell_mohm,
            "nominal_cell_voltage_v": self.nominal_cell_voltage_v,
            "weight_g": self.weight_g,
            "price_usd": self.price_usd,
            "source_url": self.source_url,
            "image_url": self.image_url
        }


class SavedBuildModel(Base):
    __tablename__ = "saved_builds"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    user_notes = Column(Text, default="")
    frame_id = Column(Integer, nullable=False)
    motor_id = Column(Integer, nullable=False)
    prop_id = Column(Integer, nullable=False)
    esc_id = Column(Integer, nullable=False)
    battery_id = Column(Integer, nullable=False)
    payload_g = Column(Float, default=0.0)
    computed_metrics_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "user_notes": self.user_notes,
            "frame_id": self.frame_id,
            "motor_id": self.motor_id,
            "prop_id": self.prop_id,
            "esc_id": self.esc_id,
            "battery_id": self.battery_id,
            "payload_g": self.payload_g,
            "computed_metrics_json": self.computed_metrics_json or {},
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
