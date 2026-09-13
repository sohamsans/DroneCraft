"""
Multi-Objective Genetic Optimizer (NSGA-II) for DroneCraft.
Evolves discrete drone component configurations against competing objectives:
Flight Time, Total Cost, and TWR / Agility.
"""

import random
import math
from typing import List, Dict, Any, Tuple
import numpy as np

from app.physics.powertrain_solver import PowertrainSolver
from app.diagnostics.advisor import DiagnosticsAdvisor

class DroneOptimizerNSGA2:
    def __init__(
        self,
        frames: List[Dict[str, Any]],
        motors: List[Dict[str, Any]],
        props: List[Dict[str, Any]],
        escs: List[Dict[str, Any]],
        batteries: List[Dict[str, Any]],
        payload_g: float = 0.0,
        target_flight_time_min: float = 15.0,
        max_budget_usd: float = 500.0,
        frame_type_filter: str = None,
        min_twr: float = 1.8,
        pop_size: int = 80,
        generations: int = 35
    ):
        self.frames = [f for f in frames if not frame_type_filter or frame_type_filter.lower() in f.get("frame_type", "").lower()] or frames
        self.motors = motors
        self.props = props
        self.escs = escs
        self.batteries = batteries

        self.payload_g = float(payload_g)
        self.target_flight_time_min = float(target_flight_time_min)
        self.max_budget_usd = float(max_budget_usd)
        self.min_twr = float(min_twr)
        self.pop_size = max(20, int(pop_size))
        self.generations = max(5, int(generations))

        # Cached simulations for efficiency
        self._eval_cache: Dict[Tuple[int, int, int, int, int], Dict[str, Any]] = {}

    def _random_individual(self) -> List[int]:
        return [
            random.randint(0, len(self.frames) - 1),
            random.randint(0, len(self.motors) - 1),
            random.randint(0, len(self.props) - 1),
            random.randint(0, len(self.escs) - 1),
            random.randint(0, len(self.batteries) - 1),
        ]

    def evaluate_individual(self, ind: List[int]) -> Dict[str, Any]:
        key = tuple(ind)
        if key in self._eval_cache:
            return self._eval_cache[key]

        frame = self.frames[ind[0]]
        motor = self.motors[ind[1]]
        prop = self.props[ind[2]]
        esc = self.escs[ind[3]]
        battery = self.batteries[ind[4]]

        try:
            solver = PowertrainSolver(
                frame_data=frame,
                motor_data=motor,
                propeller_data=prop,
                esc_data=esc,
                battery_data=battery,
                payload_weight_g=self.payload_g
            )
            sim = solver.simulate()
            diag = DiagnosticsAdvisor.evaluate_build(frame, motor, prop, esc, battery, sim)

            t_hover = sim["hover"]["hover_flight_time_minutes"]
            total_cost = sim["financial"]["total_cost_usd"]
            twr = sim["max_performance"]["twr"]
            health_score = diag["health_score"]
            is_flight_ready = diag["is_flight_ready"]

            # Penalties for violations
            penalty_score = 0.0
            if not is_flight_ready:
                penalty_score += 1000.0
            if twr < self.min_twr:
                penalty_score += (self.min_twr - twr) * 200.0
            if total_cost > self.max_budget_usd:
                penalty_score += (total_cost - self.max_budget_usd) * 2.0
            if t_hover < self.target_flight_time_min:
                penalty_score += (self.target_flight_time_min - t_hover) * 20.0

            result = {
                "individual": ind,
                "frame": frame,
                "motor": motor,
                "prop": prop,
                "esc": esc,
                "battery": battery,
                "flight_time_mins": t_hover,
                "total_cost_usd": total_cost,
                "twr": twr,
                "health_score": health_score,
                "is_flight_ready": is_flight_ready,
                "penalty": penalty_score,
                "simulation": sim,
                "diagnostics": diag,
                # Objectives for minimization: [-flight_time, cost, -twr]
                "objectives": [-t_hover + (penalty_score * 0.1), total_cost + penalty_score, -twr + (penalty_score * 0.05)]
            }
        except Exception:
            result = {
                "individual": ind,
                "frame": frame,
                "motor": motor,
                "prop": prop,
                "esc": esc,
                "battery": battery,
                "flight_time_mins": 0.0,
                "total_cost_usd": 9999.0,
                "twr": 0.0,
                "health_score": 0,
                "is_flight_ready": False,
                "penalty": 5000.0,
                "simulation": None,
                "diagnostics": None,
                "objectives": [1000.0, 9999.0, 1000.0]
            }

        self._eval_cache[key] = result
        return result

    def _dominates(self, obj_a: List[float], obj_b: List[float]) -> bool:
        """True if obj_a dominates obj_b (all <= and at least one <)"""
        all_le = all(a <= b for a, b in zip(obj_a, obj_b))
        any_lt = any(a < b for a, b in zip(obj_a, obj_b))
        return all_le and any_lt

    def _fast_non_dominated_sort(self, evaluated_pop: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """Fast non-dominated sorting into Pareto fronts."""
        n = len(evaluated_pop)
        domination_counts = [0] * n
        dominated_indices = [[] for _ in range(n)]
        fronts = [[]]

        for i in range(n):
            for j in range(n):
                if i == j:
                    continue
                if self._dominates(evaluated_pop[i]["objectives"], evaluated_pop[j]["objectives"]):
                    dominated_indices[i].append(j)
                elif self._dominates(evaluated_pop[j]["objectives"], evaluated_pop[i]["objectives"]):
                    domination_counts[i] += 1
            
            if domination_counts[i] == 0:
                fronts[0].append(evaluated_pop[i])

        current_front_idx = 0
        while len(fronts[current_front_idx]) > 0:
            next_front = []
            for item in fronts[current_front_idx]:
                i = evaluated_pop.index(item)
                for j in dominated_indices[i]:
                    domination_counts[j] -= 1
                    if domination_counts[j] == 0:
                        next_front.append(evaluated_pop[j])
            current_front_idx += 1
            if len(next_front) > 0:
                fronts.append(next_front)
            else:
                break

        return [f for f in fronts if len(f) > 0]

    def _crossover(self, parent1: List[int], parent2: List[int]) -> List[int]:
        """Uniform crossover between two component index arrays."""
        child = []
        for g1, g2 in zip(parent1, parent2):
            child.append(g1 if random.random() < 0.5 else g2)
        return child

    def _mutate(self, ind: List[int], mutation_rate: float = 0.20) -> List[int]:
        """Random reset mutation on gene loci."""
        mutated = list(ind)
        if random.random() < mutation_rate:
            mutated[0] = random.randint(0, len(self.frames) - 1)
        if random.random() < mutation_rate:
            mutated[1] = random.randint(0, len(self.motors) - 1)
        if random.random() < mutation_rate:
            mutated[2] = random.randint(0, len(self.props) - 1)
        if random.random() < mutation_rate:
            mutated[3] = random.randint(0, len(self.escs) - 1)
        if random.random() < mutation_rate:
            mutated[4] = random.randint(0, len(self.batteries) - 1)
        return mutated

    def run_optimization(self) -> Dict[str, Any]:
        """
        Executes NSGA-II generational search and returns Pareto Frontier & Champion builds.
        """
        # Initialize population
        population = [self._random_individual() for _ in range(self.pop_size)]

        history = []
        for gen in range(self.generations):
            evaluated = [self.evaluate_individual(ind) for ind in population]
            fronts = self._fast_non_dominated_sort(evaluated)
            
            # Record generation telemetry
            valid_builds = [e for e in evaluated if e["is_flight_ready"]]
            best_time = max([e["flight_time_mins"] for e in valid_builds], default=0.0)
            avg_cost = np.mean([e["total_cost_usd"] for e in evaluated]) if evaluated else 0.0
            
            history.append({
                "generation": gen + 1,
                "front_size": len(fronts[0]) if fronts else 0,
                "valid_count": len(valid_builds),
                "best_flight_time_mins": round(float(best_time), 2),
                "avg_cost_usd": round(float(avg_cost), 2)
            })

            # Selection and breeding for next generation
            next_pop = []
            for front in fronts:
                for ind_eval in front:
                    next_pop.append(ind_eval["individual"])
                    if len(next_pop) >= self.pop_size:
                        break
                if len(next_pop) >= self.pop_size:
                    break

            # Create offspring
            offspring = []
            while len(offspring) < self.pop_size:
                p1 = random.choice(next_pop[:max(5, len(next_pop)//2)])
                p2 = random.choice(next_pop[:max(5, len(next_pop)//2)])
                child = self._crossover(p1, p2)
                child = self._mutate(child)
                offspring.append(child)

            population = next_pop[:self.pop_size//2] + offspring[:self.pop_size//2]

        # Final evaluation
        final_evaluated = [self.evaluate_individual(ind) for ind in population]
        # Remove duplicate builds in evaluation pool
        unique_evals = {}
        for ev in final_evaluated:
            key = tuple(ev["individual"])
            if key not in unique_evals:
                unique_evals[key] = ev
        all_unique = list(unique_evals.values())

        final_fronts = self._fast_non_dominated_sort(all_unique)
        pareto_front = final_fronts[0] if len(final_fronts) > 0 else all_unique[:10]

        # Filter for flight-ready valid builds
        valid_pareto = [b for b in pareto_front if b["is_flight_ready"]]
        if not valid_pareto:
            valid_pareto = [b for b in all_unique if b["is_flight_ready"]]
        if not valid_pareto:
            valid_pareto = pareto_front

        # Extract 3 Distinct Champion Builds
        # 1. Endurance Champion (Longest flight time)
        endurance_champion = max(valid_pareto, key=lambda x: x["flight_time_mins"])
        
        # 2. Value Champion (Best combined endurance & agility per dollar)
        value_champion = max(
            valid_pareto,
            key=lambda x: (x["flight_time_mins"] * x["twr"]) / max(1.0, x["total_cost_usd"])
        )
        
        # 3. Agility Champion (Highest TWR)
        agility_champion = max(valid_pareto, key=lambda x: x["twr"])

        # Format Pareto points for 2D/3D charts
        pareto_points = []
        for item in pareto_front:
            pareto_points.append({
                "individual_indices": item["individual"],
                "build_name": f"{item['frame']['name']} + {item['motor']['model']} + {item['prop']['model']}",
                "flight_time_mins": round(item["flight_time_mins"], 1),
                "total_cost_usd": round(item["total_cost_usd"], 2),
                "twr": round(item["twr"], 2),
                "auw_g": round(item["simulation"]["mass"]["auw_g"] if item["simulation"] else 0, 1),
                "health_score": item["health_score"],
                "is_flight_ready": item["is_flight_ready"],
                "frame": item["frame"],
                "motor": item["motor"],
                "prop": item["prop"],
                "esc": item["esc"],
                "battery": item["battery"]
            })

        def format_champion(champ: Dict[str, Any], title: str, badge: str, description: str) -> Dict[str, Any]:
            return {
                "title": title,
                "badge": badge,
                "description": description,
                "flight_time_mins": round(champ["flight_time_mins"], 1),
                "total_cost_usd": round(champ["total_cost_usd"], 2),
                "twr": round(champ["twr"], 2),
                "auw_g": round(champ["simulation"]["mass"]["auw_g"] if champ["simulation"] else 0, 1),
                "hover_throttle_pct": round(champ["simulation"]["hover"]["hover_throttle_pct"] if champ["simulation"] else 0, 1),
                "health_score": champ["health_score"],
                "frame": champ["frame"],
                "motor": champ["motor"],
                "prop": champ["prop"],
                "esc": champ["esc"],
                "battery": champ["battery"],
                "simulation": champ["simulation"],
                "diagnostics": champ["diagnostics"]
            }

        return {
            "summary": {
                "generations_completed": self.generations,
                "population_size": self.pop_size,
                "total_evaluated_combinations": len(self._eval_cache),
                "pareto_frontier_count": len(pareto_points),
                "valid_flight_ready_count": len(valid_pareto)
            },
            "history": history,
            "pareto_frontier": pareto_points,
            "top_builds": {
                "endurance_champion": format_champion(
                    endurance_champion,
                    "Max Endurance Champion",
                    "Max Flight Time",
                    "Optimized for maximum hovering endurance and low-RPM efficiency."
                ),
                "value_champion": format_champion(
                    value_champion,
                    "Optimal Value / Budget Champion",
                    "Best $/Performance",
                    "Highest flight time and agility performance per dollar spent."
                ),
                "agility_champion": format_champion(
                    agility_champion,
                    "Acrobatic / Agility Champion",
                    "Max TWR & Speed",
                    "Maximum thrust-to-weight ratio and punchout responsiveness."
                )
            }
        }
