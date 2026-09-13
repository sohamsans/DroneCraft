"""
Unit Tests for DroneCraft NSGA-II Multi-Objective Genetic Optimizer.
"""

import pytest
from app.core.seed_data import (
    SEED_FRAMES,
    SEED_MOTORS,
    SEED_PROPELLERS,
    SEED_ESCS,
    SEED_BATTERIES
)
from app.optimizer.nsga2_optimizer import DroneOptimizerNSGA2


def test_genetic_optimizer_run():
    optimizer = DroneOptimizerNSGA2(
        frames=SEED_FRAMES,
        motors=SEED_MOTORS,
        props=SEED_PROPELLERS,
        escs=SEED_ESCS,
        batteries=SEED_BATTERIES,
        payload_g=50.0,
        target_flight_time_min=10.0,
        max_budget_usd=600.0,
        min_twr=1.8,
        pop_size=30,
        generations=5
    )

    results = optimizer.run_optimization()

    assert "summary" in results
    assert "pareto_frontier" in results
    assert "top_builds" in results
    assert len(results["pareto_frontier"]) > 0
    assert "endurance_champion" in results["top_builds"]
    assert "value_champion" in results["top_builds"]
    assert "agility_champion" in results["top_builds"]
