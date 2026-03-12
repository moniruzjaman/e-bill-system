# Master Directive - Fertilizer Tracking E-Bill System

## Project Overview
This system is designed for tracking fertilizer distribution, managing subsidies, and monitoring Nutrient Use Efficiency (NUE) based on international policy recommendations (e.g., Learning from Asia Report).

## Layer 1: Directives (SOPs)
- `directives/00_master_directive.md`: This file. Overview of the architecture.
- `directives/ui_updates.md`: Guidelines for maintaining the premium aesthetics (Inter font, Glassmorphism, Chart.js).

## Layer 2: Orchestration (Agent Logic)
- Antigravity acts as the orchestrator, reading directives and executing scripts in the `execution/` layer.

## Layer 3: Execution (Deterministic Scripts)
- All Python scripts for data processing or API integrations live in `execution/`.
- Temporary files and intermediate data live in `.tmp/`.

## Working Principles
1. **Premium First**: Any UI modification must maintain the high-aesthetic standards established.
2. **Policy Aligned**: Ensure features remain aligned with referenced reports (India e-Bill, China STFFT).
3. **Data Integrity**: Blockchain-verified transaction logic must be preserved in all data handling.
