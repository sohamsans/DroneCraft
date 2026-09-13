# DroneCraft / AeroOptima: Intelligent Drone Configurator & Theoretical Optimizer
## Project Execution & Implementation Plan (`plan.md`)

---

### 1. Project Overview & Objective
An end-to-end drone design, diagnostics, and optimization platform combining:
1. **Catalog Ingestion & Normalization**: Automated scraping and structured parsing of commercial multirotor/UAV parts (motors, ESCs, propellers, batteries, frames, flight controllers).
2. **Physics & Simulation Engine**: BEMT aerodynamic modeling, DC equivalent motor circuits, internal battery resistance & voltage sag modeling, and All-Up-Weight (AUW) estimation.
3. **Real-time Diagnostic HUD**: Automated detection of powertrain mismatches, thermal overloads, TWR deficiencies, prop-frame collisions, and voltage sag brownouts.
4. **Theoretical Drone Optimizer**: Hybrid solver (Continuous Physics Relaxation + NSGA-II Discrete Genetic Algorithm) that outputs optimal part combinations and Pareto trade-off frontiers (Flight Time vs. Cost vs. Agility).

---

### 2. System Architecture & Tech Stack

```
                                  ┌─────────────────────────────────────────┐
                                  │           Client (Next.js 14)           │
                                  │  - Configurator & Builder UI            │
                                  │  - Real-time Diagnostic Alert HUD       │
                                  │  - 2D/3D Plotly & Three.js Visualizer   │
                                  └────────────────────┬────────────────────┘
                                                       │ REST / WebSocket
                                  ┌────────────────────▼────────────────────┐
                                  │        Backend API (FastAPI)            │
                                  ├────────────────────┬────────────────────┤
                                  │ Physics Simulation │ Genetic Optimizer  │
                                  │  - BEMT Hover/Max  │  - NSGA-II (DEAP)  │
                                  │  - Electrical Loop │  - Mixed Integer   │
                                  └─────────┬──────────┴──────────┬─────────┘
                                            │                     │
                ┌───────────────────────────▼───┐     ┌───────────▼────────────┐
                │   Scraper & Normalizer ETL    │     │   PostgreSQL + JSONB   │
                │   - Playwright / Scrapy       │────▶│   - Normalized Parts   │
                │   - Structured Spec Validator │     │   - Cached Simulations │
                └───────────────────────────────┘     └────────────────────────┘
```

#### Tech Stack Specification:
* **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Zustand (state management), Plotly.js / Chart.js (curves & Pareto frontiers), Three.js / React Three Fiber (frame & clearance checks).
* **Backend API**: Python 3.11+, FastAPI, Pydantic v2, Uvicorn, Celery + Redis (for asynchronous scraping & long-running optimization jobs).
* **Physics & Optimization**: NumPy, SciPy (BEMT roots & non-linear solves), DEAP / PyMoo (Multi-objective Genetic Algorithm NSGA-II).
* **Database**: PostgreSQL with JSONB columns for flexible component specs, SQLAlchemy 2.0 / Alembic.
* **Scraping Pipeline**: Scrapy, Playwright (dynamic DOMs), BeautifulSoup4, regex sanitizers, LLM-based fallback parsing for thrust tables.

---

### 3. Database Schema (PostgreSQL / Relational + JSONB)

#### Tables:
1. `frames`:
   * `id`, `name`, `manufacturer`, `wheelbase_mm`, `frame_type` (Quad-X, Hex-X, Octo, etc.), `max_prop_size_inch`, `dry_weight_g`, `payload_volume_cm3`, `price_usd`, `source_url`, `specs_json`
2. `motors`:
   * `id`, `model`, `manufacturer`, `kv`, `stator_size` (e.g. 2207, 4014), `internal_resistance_mohm`, `idle_current_a`, `max_continuous_current_a`, `max_power_w`, `recommended_voltage_s_min`, `recommended_voltage_s_max`, `weight_g`, `price_usd`, `thrust_table_json`
3. `propellers`:
   * `id`, `model`, `manufacturer`, `diameter_inch`, `pitch_inch`, `blade_count`, `weight_g`, `ct_hover`, `cp_hover`, `material`, `price_usd`
4. `escs`:
   * `id`, `model`, `manufacturer`, `continuous_current_a`, `burst_current_a`, `voltage_min_s`, `voltage_max_s`, `protocol`, `weight_g`, `price_usd`
5. `batteries`:
   * `id`, `brand`, `cell_chemistry` (LiPo, Li-ion), `cells_s`, `capacity_mah`, `c_rating_continuous`, `c_rating_burst`, `internal_resistance_cell_mohm`, `weight_g`, `price_usd`
6. `saved_builds`:
   * `id`, `user_id`, `name`, `frame_id`, `motor_id`, `prop_id`, `esc_id`, `battery_id`, `payload_g`, `computed_metrics_json`, `created_at`

---

### 4. Mathematical Engine & Physics Pipeline

#### Step 1: Mass Rollup
$$m_{\text{AUW}} = m_{\text{frame}} + N_{\text{rotors}} \cdot (m_{\text{motor}} + m_{\text{ESC}} + m_{\text{prop}}) + m_{\text{battery}} + m_{\text{avionics}} + m_{\text{payload}}$$

#### Step 2: Hover Equilibrium
Hover thrust per rotor:
$$T_{\text{hov}} = \frac{m_{\text{AUW}} \cdot g}{N_{\text{rotors}}}$$
Solve for hover rotational speed $n_{\text{hov}}$ [rev/s]:
$$n_{\text{hov}} = \sqrt{\frac{T_{\text{hov}}}{C_T \rho D^4}}$$

#### Step 3: Electrical & Voltage Droop
$$\text{Torque } Q_{\text{hov}} = \frac{C_P}{2\pi} \rho n_{\text{hov}}^2 D^5$$
$$\text{Motor Current } I_{m,\text{hov}} = \frac{2\pi K_v}{60} Q_{\text{hov}} + I_0$$
$$I_{\text{bus,hov}} = N_{\text{rotors}} \cdot I_{m,\text{hov}} + I_{\text{avionics}}$$
$$V_{\text{bat,actual}} = S \cdot V_{\text{cell,nom}} - I_{\text{bus,hov}} \cdot (S \cdot R_{\text{cell}})$$
$$\text{Hover Duty Cycle } \delta_{\text{hov}} = \frac{\frac{2\pi n_{\text{hov}}}{K_{v,\text{SI}}} + I_{m,\text{hov}} R_m}{V_{\text{bat,actual}}}$$
$$\text{Hover Time } t_{\text{hov}} = \frac{C_{\text{bat}} \cdot \text{DoD}}{I_{\text{bus,hov}}} \times 60$$

#### Step 4: Max Throttle & Flight Dynamics
Solve non-linear equation for $n_{\text{max}}$ at full battery terminal voltage ($\delta = 1.0$). Compute $\text{TWR} = \frac{N_{\text{rotors}} T_{\text{max}}}{m_{\text{AUW}} g}$, top speed, and thermal dissipation.

---

### 5. Diagnostics & Rules Engine

The diagnostics service evaluates the build against deterministic safety and performance rules:
1. **Geometric Interference**: $D_{\text{prop}} > D_{\text{frame,max}} \implies$ **FATAL ERROR**: Propeller strikes frame.
2. **Thrust Authority**: $\text{TWR} < 1.8 \implies$ **CRITICAL**: Low control authority in wind. $\text{TWR} > 6.0 \implies$ **NOTE**: Extreme twitchiness/oversized power.
3. **ESC Overcurrent**: $I_{m,\text{max}} > 0.85 \times I_{\text{ESC,cont}} \implies$ **WARNING**: Overcurrent risk during bursts.
4. **Motor Thermal Saturation**: $P_{\text{elec,max}} > P_{\text{motor,max}} \implies$ **WARNING**: Stator winding thermal burnout.
5. **Battery Sag / C-Rating**: $I_{\text{bus,max}} > C_{\text{burst}} \cdot \text{Capacity} \implies$ **CRITICAL**: Excessive voltage sag / brownout.
6. **Efficiency Band**: $\delta_{\text{hov}} > 0.65 \implies$ **INEFFICIENT**: Motor operating far outside optimal torque band.

---

### 6. Genetic Optimizer Workflow (NSGA-II)

1. **User Objective**: Specify Payload ($kg$), Max Cost ($), Target Flight Time ($min$), Frame Type.
2. **Initial Population**: 100 discrete combinations drawn from the PostgreSQL catalog.
3. **Fitness Evaluation**:
   * Objective 1: Maximize Hover Time $t_{\text{hover}}$
   * Objective 2: Minimize Total Cost $\sum \text{Price}$
   * Objective 3: Maximize Agility / TWR
   * Constraint Penalties: Apply large penalty $\mu_i$ for any diagnostic failure (overcurrent, prop collision).
4. **Evolution**: 50 generations of crossover, mutation, and non-dominated sorting.
5. **Output**: Top 3 recommended builds + Interactive Pareto Frontier curve.

---

### 7. Implementation Roadmap & Milestones

* **Milestone 1 (Data & Scraping Core - Week 1-2)**:
  * Setup PostgreSQL schema + Alembic migrations.
  * Build scrapers for top 3 drone retail/manufacturer sites with data sanitization pipelines.
* **Milestone 2 (Physics & Diagnostic Engine - Week 3)**:
  * Implement Python physics simulation library (`drone_physics`).
  * Unit tests validating against eCalc & wind-tunnel benchmark thrust data.
  * Build diagnostic evaluation engine with structured alert outputs.
* **Milestone 3 (Optimization Engine - Week 4)**:
  * Implement NSGA-II solver using `DEAP` / `PyMoo`.
  * Create FastAPI endpoints for `/api/simulate`, `/api/diagnose`, and `/api/optimize`.
* **Milestone 4 (Frontend Configurator & UI - Week 5-6)**:
  * Build interactive Builder UI with live responsive metrics HUD.
  * Implement Interactive Pareto Frontier (Plotly) and 3D Frame Layout Checker (Three.js).
* **Milestone 5 (Testing, Deployment & Polishing - Week 7)**:
  * Dockerize (Backend, Worker, DB, Frontend).
  * Deploy on AWS/Render/Vercel with Redis queue for background optimizer tasks.
