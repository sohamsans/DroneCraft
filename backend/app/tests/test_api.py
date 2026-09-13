"""
Integration Tests for DroneCraft FastAPI Endpoints.
"""

import pytest
import httpx
from app.main import app
from app.core.database import init_db

# Initialize database schema and seeds for testing
init_db()

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.fixture
async def async_client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


@pytest.mark.anyio
async def test_health_endpoint(async_client):
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.anyio
async def test_list_parts_endpoint(async_client):
    response = await async_client.get("/api/parts/frames")
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "frames"
    assert data["count"] > 0


@pytest.mark.anyio
async def test_simulate_endpoint(async_client):
    payload = {
        "frame": {
            "name": "Test Frame",
            "manufacturer": "Test",
            "wheelbase_mm": 220.0,
            "frame_type": "Quad-X",
            "max_prop_size_inch": 5.1,
            "dry_weight_g": 120.0,
            "price_usd": 30.0
        },
        "motor": {
            "model": "Test Motor",
            "manufacturer": "Test",
            "kv": 2400.0,
            "internal_resistance_mohm": 50.0,
            "idle_current_a": 1.0,
            "max_continuous_current_a": 35.0,
            "max_power_w": 700.0,
            "recommended_voltage_s_min": 3,
            "recommended_voltage_s_max": 4,
            "weight_g": 32.0,
            "price_usd": 18.0
        },
        "propeller": {
            "model": "Test Prop",
            "manufacturer": "Test",
            "diameter_inch": 5.0,
            "pitch_inch": 4.0,
            "blade_count": 3,
            "weight_g": 4.0,
            "price_usd": 3.0
        },
        "esc": {
            "model": "Test ESC",
            "manufacturer": "Test",
            "continuous_current_a": 40.0,
            "burst_current_a": 50.0,
            "voltage_min_s": 3,
            "voltage_max_s": 6,
            "weight_g": 12.0,
            "price_usd": 40.0
        },
        "battery": {
            "brand": "Test Bat",
            "model": "Test Bat 4S",
            "cells_s": 4,
            "capacity_mah": 1500.0,
            "c_rating_continuous": 80.0,
            "c_rating_burst": 150.0,
            "internal_resistance_cell_mohm": 4.5,
            "weight_g": 180.0,
            "price_usd": 25.0
        },
        "payload_weight_g": 0.0
    }

    response = await async_client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert "hover" in res_data["data"]
    assert "max_performance" in res_data["data"]


@pytest.mark.anyio
async def test_diagnose_endpoint(async_client):
    payload = {
        "frame": {
            "name": "Test Frame",
            "manufacturer": "Test",
            "wheelbase_mm": 220.0,
            "frame_type": "Quad-X",
            "max_prop_size_inch": 5.1,
            "dry_weight_g": 120.0,
            "price_usd": 30.0
        },
        "motor": {
            "model": "Test Motor",
            "manufacturer": "Test",
            "kv": 2400.0,
            "internal_resistance_mohm": 50.0,
            "idle_current_a": 1.0,
            "max_continuous_current_a": 35.0,
            "max_power_w": 700.0,
            "recommended_voltage_s_min": 3,
            "recommended_voltage_s_max": 4,
            "weight_g": 32.0,
            "price_usd": 18.0
        },
        "propeller": {
            "model": "Test Prop",
            "manufacturer": "Test",
            "diameter_inch": 5.0,
            "pitch_inch": 4.0,
            "blade_count": 3,
            "weight_g": 4.0,
            "price_usd": 3.0
        },
        "esc": {
            "model": "Test ESC",
            "manufacturer": "Test",
            "continuous_current_a": 40.0,
            "burst_current_a": 50.0,
            "voltage_min_s": 3,
            "voltage_max_s": 6,
            "weight_g": 12.0,
            "price_usd": 40.0
        },
        "battery": {
            "brand": "Test Bat",
            "model": "Test Bat 4S",
            "cells_s": 4,
            "capacity_mah": 1500.0,
            "c_rating_continuous": 80.0,
            "c_rating_burst": 150.0,
            "internal_resistance_cell_mohm": 4.5,
            "weight_g": 180.0,
            "price_usd": 25.0
        },
        "payload_weight_g": 0.0
    }

    response = await async_client.post("/api/diagnose", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert "diagnostics" in res_data
    assert "health_score" in res_data["diagnostics"]
