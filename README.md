# DroneCraft / AeroOptima

**An Integrated Multirotor Dynamics Configurator, Deterministic Diagnostics Engine, and Multi-Objective Genetic Optimizer Platform**

DroneCraft is a specialized aerospace and systems engineering platform designed to model, analyze, and optimize multirotor unmanned aerial vehicles (UAVs). The system pairs Blade Element Momentum Theory (BEMT) aerodynamic analysis with equivalent DC motor electromechanical circuit modeling, battery internal resistance droop physics, deterministic safety checks, and an NSGA-II discrete genetic optimizer to resolve Pareto trade-off frontiers across flight endurance, system cost, and agility.

---

## Technical Features

### 1. Aerodynamics and Powertrain Simulation Engine
* **Blade Element Momentum Theory (BEMT)**: Implements actuator disk theory coupled with discretized radial blade elements and Prandtl tip-loss correction factors to compute thrust ($C_T$), power ($C_P$), and torque coefficients.
* **Environmental Normalization**: Incorporates International Standard Atmosphere (ISA) models to scale ambient air density ($\rho$) dynamically as a function of operating altitude ($h$) and temperature ($T_{\text{amb}}$).
* **DC Motor Equivalent Circuit**: Models back-EMF ($E_b = \frac{60 n}{K_v}$), motor torque constant ($K_t = \frac{60}{2\pi K_v}$), phase current ($I_m = \frac{Q}{K_t} + I_0$), phase voltage ($V_m = E_b + I_m R_m$), and stator thermal loss ($P_{\text{heat}} = I_m^2 R_m$).
* **Battery Electrochemistry and IR Sag**: Computes terminal voltage sag under loaded bus current ($V_{\text{bat}} = S \cdot V_{\text{cell,nom}} - I_{\text{bus}} \cdot S \cdot R_{\text{cell}}$), evaluating continuous/burst C-rate limits and cell brownout thresholds ($V_{\text{cell}} < 3.2\text{V}$).
* **Non-Linear Max Throttle Root Solving**: Uses numerical root finding (`scipy.optimize.brentq`) at full throttle ($\delta = 1.0$) to determine peak rotational velocity ($n_{\text{max}}$), maximum total thrust, and Thrust-to-Weight Ratio ($\text{TWR}$).

### 2. Deterministic Safety Diagnostics Engine
* **Geometric Clearance Verification**: Checks propeller swept diameter ($D_{\text{prop}}$) against frame maximum allowance ($D_{\text{frame,max}}$) to prevent rotor collisions.
* **Control Authority Validation**: Evaluates $\text{TWR}$ against stability thresholds ($< 1.3$ Fatal, $< 1.8$ Critical, $> 8.0$ Info).
* **Thermal & Electrical Limits**: Monitors ESC burst/continuous current headroom, motor stator thermal dissipation limits, and battery discharge rates.
* **System Health Scoring**: Aggregates rule failures into a normalized 0-100 safety score paired with actionable component replacement recommendations.

### 3. Multi-Objective Genetic Optimizer (NSGA-II)
* **Discrete Catalog Chromosomes**: Encodes vehicle configurations as discrete integer vectors: `[frame_idx, motor_idx, prop_idx, esc_idx, battery_idx]`.
* **Multi-Objective Optimization**: Evaluates competing objectives simultaneously:
  1. Maximize Hover Flight Endurance ($t_{\text{hover}}$)
  2. Minimize Total System Cost ($\sum \text{Price}$)
  3. Maximize Agility ($\text{TWR}$)
* **Pareto Frontier Generation**: Applies non-dominated sorting and crowding distance ranking to identify optimal design trade-offs and extract three champion builds: Endurance Champion, Value Champion, and Agility Champion.

### 4. User Interface and Visualizers
* **Interactive Configurator**: Component selection interface with live AUW rollup, payload mass controls, and real-time telemetry updates.
* **Telemetry HUD**: Dynamic gauges for hover throttle %, flight time, power dissipation, efficiency ($g/\text{W}$), and interactive 0-100% throttle performance curves.
* **3D Clearance Viewer**: Interactive orbital canvas displaying arm geometry, motor mounts, swept propeller discs, and collision warning boundaries.

---

## Mathematical Formulation

### 1. Mass Rollup
$$m_{\text{AUW}} = m_{\text{frame}} + N_{\text{rotors}} \cdot (m_{\text{motor}} + m_{\text{ESC}} + m_{\text{prop}}) + m_{\text{battery}} + m_{\text{avionics}} + m_{\text{payload}}$$

### 2. Hover Equilibrium Velocity
$$T_{\text{hov}} = \frac{m_{\text{AUW}} \cdot g}{N_{\text{rotors}}}$$

$$n_{\text{hov}} = \sqrt{\frac{T_{\text{hov}}}{C_T \cdot \rho \cdot D^4}}$$

### 3. Electromechanical & Battery Bus Equilibrium
$$Q_{\text{hov}} = \frac{C_P}{2\pi} \rho n_{\text{hov}}^2 D^5$$

$$I_{m,\text{hov}} = \frac{2\pi K_v}{60} Q_{\text{hov}} + I_0$$

$$I_{\text{bus,hov}} = N_{\text{rotors}} \cdot I_{m,\text{hov}} + I_{\text{avionics}}$$

$$V_{\text{bat,loaded}} = S \cdot V_{\text{cell,nom}} - I_{\text{bus,hov}} \cdot (S \cdot R_{\text{cell}})$$

$$\delta_{\text{hov}} = \frac{\frac{2\pi n_{\text{hov}}}{K_{v,\text{SI}}} + I_{m,\text{hov}} R_m}{V_{\text{bat,loaded}}}$$

$$t_{\text{hover}} = \frac{C_{\text{bat}} \cdot \text{DoD}}{I_{\text{bus,hov}}} \cdot 60$$

### 4. Maximum Throttle Equilibrium
At full duty cycle ($\delta = 1.0$), solve for maximum rotational velocity $n_{\text{max}}$ where:
$$V_{\text{bat}}(n_{\text{max}}) - \left[ E_b(n_{\text{max}}) + I_m(n_{\text{max}}) R_m \right] = 0$$

$$\text{TWR} = \frac{N_{\text{rotors}} \cdot C_T \rho n_{\text{max}}^2 D^4}{m_{\text{AUW}} \cdot g}$$

---

## Repository Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/                  # FastAPI REST routes (parts, simulate, diagnose, optimize, export)
│   │   ├── core/                 # Database connection, settings, and seed dataset
│   │   ├── models/               # SQLAlchemy ORM models and Pydantic validation schemas
│   │   ├── physics/              # Aerodynamic BEMT, DC motor, battery sag, and powertrain solvers
│   │   ├── diagnostics/          # Safety rules matrix and health scoring engine
│   │   ├── optimizer/            # NSGA-II multi-objective genetic algorithm solver
│   │   ├── scraper/              # Component spec table parser and HTML normalizer
│   │   ├── tests/                # Unit and integration test suite
│   │   └── main.py               # Application entry point and router configuration
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js 14 App Router layout and main page
│   │   ├── components/           # Configurator, Telemetry HUD, Diagnostics, 3D Viewer, Optimizer, Catalog
│   │   └── lib/                  # State management store, API client, and TypeScript interfaces
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docker-compose.yml
├── Dockerfile.backend
└── Dockerfile.frontend
```

---

## Installation and Setup

### Prerequisites
* Python 3.11+
* Node.js 18+
* npm or pnpm

### Backend Setup
1. Change into the backend directory and install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   * OpenAPI Documentation: `http://localhost:8000/docs`
   * Health Check: `http://localhost:8000/api/health`

### Frontend Setup
1. Change into the frontend directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   * Web Application: `http://localhost:3000`

### Running Tests
Execute the backend test suite via `pytest`:
```bash
python -m pytest backend/app/tests -v
```

### Docker Deployment
Build and run the entire stack using Docker Compose:
```bash
docker-compose up --build
```
