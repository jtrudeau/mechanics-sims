# SN1 Mechanics Simulations

An interactive educational web application for exploring classical mechanics concepts through physics simulations.

## Project Overview

This is a React + TypeScript app built with Vite. It provides interactive simulations covering:
- 1D Kinematics & Instantaneous Velocity
- 1D Dynamics & Friction
- 2D Dynamics & Circular Motion
- Newton's 3rd Law & Interacting Objects

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 8
- **Routing:** React Router 7
- **Math Rendering:** KaTeX / react-katex
- **Icons:** Lucide React

## Project Structure

```
src/
  assets/          # Images and SVGs
  components/
    layout/        # Dashboard and SimulationLayout components
    physics/       # Shared physics utilities (drawUtils.ts)
  hooks/           # usePhysicsEngine.ts - requestAnimationFrame loop
  pages/
    simulations/   # Individual simulation pages
  App.tsx          # Routes
  main.tsx         # Entry point
```

## Development

- **Run:** `npm run dev` (starts on port 5000)
- **Build:** `npm run build`

## Replit Setup Notes

- Vite is configured to run on `0.0.0.0:5000` with `allowedHosts: true` for the Replit proxy
- The `base` path was changed from `/mechanics-sims/` to `/` for Replit compatibility
- The React Router `basename` was removed accordingly
