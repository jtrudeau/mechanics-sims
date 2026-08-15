# SN1 Mechanics Simulations

Interactive figures for college Mechanics (**203-SN1-RE**) and related classical mechanics courses. Each simulation pairs a live canvas with equations, free-body diagrams, and graphs so students can predict, interact, and explain.

**Author:** [Joel Trudeau](mailto:jtrudeau@dawsoncollege.qc.ca), Physics, Dawson College (office 7A.20, local 4019).

MIT License. You are welcome to use and adapt the suite in your own classroom.

## For teachers

Share the site with students as you would any other web resource. There is no sign-in.

**Simulations** — open a topic, set parameters, and use Play. Collapse the sidebar or use **Widen canvas** when projecting.

**Tips & Revision** — learning goals, operating notes, common difficulties, and revision problems that can load a matching control setup.

**Problem sets** (`/problems`) — numeric and multiple-choice checks in the browser. Progress stays on that device only.

**For Teachers** (`/for-teachers`) — a short classroom pattern, suggested topic order, and the control to reveal hints and worked solutions.

### Keeping solutions out of student view

Hints and worked solutions are **hidden by default**. Check still grades an attempt (correct / not yet) without showing the write-up.

Unlock from **For Teachers** with the instructor passphrase. Unlock lasts for that browser tab; use **Lock solutions** (or close the tab) before handing a machine to a student. **Quiz mode** (`?quiz=1` on a Tips & Revision page) keeps answers hidden even after unlock, which is useful on a projector.

This is a classroom deterrent, not true access control. The site is a static web app with no accounts: a determined student can still inspect the page source. Do not put the passphrase in student-facing materials or in this README.

To set your own passphrase at build time, put the SHA-256 hex digest (lowercase, of the trimmed lowercase passphrase) in `VITE_TEACHER_UNLOCK_HASH`.

## Run locally

You need [Node.js](https://nodejs.org/).

```bash
git clone https://github.com/jtrudeau/mechanics-sims.git
cd mechanics-sims
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build          # production build
npm run build:gh-pages # same, with base path /mechanics-sims/
```

## Simulations

Kinematics, forces, then energy and rotation:

1. Instantaneous velocity
2. Kinematics graphs
3. Friction
4. Circular motion
5. Newton’s third law
6. Newton’s second law (cart)
7. Force table
8. Work–energy track
9. Fixed-axis rotation
10. Rotational kinematics

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Joel Trudeau.
