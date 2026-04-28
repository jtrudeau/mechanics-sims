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
- **Build (standard):** `npm run build`
- **Build for GitHub Pages:** `npm run build:gh-pages`
  - Outputs to `dist/` with base path `/mechanics-sims/`
  - Deploy the `dist/` folder to the `gh-pages` branch

## Replit Setup Notes

- Vite is configured to run on `0.0.0.0:5000` with `allowedHosts: true` for the Replit proxy
- `import.meta.env.BASE_URL` drives the React Router `basename` automatically
  - Dev: BASE_URL = `/`, so basename = `""` (no prefix)
  - GH Pages build: BASE_URL = `/mechanics-sims/`, so basename = `/mechanics-sims`

## Simulation Improvements

- **Instantaneous Velocity**: Proper axis tick labels & titles, Δt–Δx right-angle triangle on secant, drop lines, convergence % readout
- **Friction**: Floor hatch marks, labeled f vs F_app plot with colored STATIC/KINETIC regions, regime badge, normal force readout
- **Circular Motion**: Fading position trail, radius line with label, θ arc indicator, ω speed clamp at ±12 rad/s, period readout
- **Newton's 3rd Law**: Scrolling velocity vs time chart, in-canvas force labels, hatch floor, mass labels on blocks
