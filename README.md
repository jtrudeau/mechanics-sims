# Mechanics Simulations (SN1 Physics)

A suite of interactive physics simulations designed specifically for the SN1 mechanics curriculum. This project bridges the gap between static textbook theory and dynamic physical phenomena, providing students with immediate, interactive feedback as they explore core concepts in classical mechanics.

## Design Philosophy

This project takes a "Guided Companion" approach to interactive learning:
1.  **Rigorous Typesetting:** All physics variables, equations, and textbook text are typeset using KaTeX and the STIX Two Text serif font to match the visual rigor of academic publications.
2.  **Immediate Interactivity:** The theoretical framing sits directly alongside the simulation controls. Students are actively prompted to change variables and immediately observe the kinematic or dynamic consequences.
3.  **Modern Aesthetics:** The application uses a clean, glassmorphic UI, ensuring that the tool feels premium and engaging.

## Included Simulations

1.  **Instantaneous Velocity:** Explores the limit definition of velocity ($v = \lim_{\Delta t \to 0} \frac{\Delta x}{\Delta t}$) using dynamic secant and tangent lines on a position-time graph.
2.  **Friction vs. Applied Force:** Demonstrates the breakaway point from static to kinetic friction, with real-time vector visualization.
3.  **Circular Motion:** Visualizes the relationship between tangential and radial acceleration components in both uniform and non-uniform circular motion.
4.  **Newton's 3rd Law:** A multi-body simulation demonstrating that internal interaction forces ($F_{12}$ and $F_{21}$) are always equal and opposite, regardless of mass disparities.

## For Educators: How to Use and Modify

This repository is completely open source (MIT License). You are encouraged to fork, modify, and adapt these simulations for your own physics classroom.

### Prerequisites

You will need [Node.js](https://nodejs.org/) installed on your machine.

### Local Development

1.  Clone the repository:
    ```bash
    git clone https://github.com/jtrudeau/mechanics-sims.git
    cd mechanics-sims/app
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the local development server:
    ```bash
    npm run dev
    ```

### Customizing the Content

The layout of the app is component-driven via React and Vite. 
*   **To change the textbook text:** Open any file in `src/pages/simulations/` and modify the JSX inside the `<SimulationLayout>`'s `theoryContent` prop.
*   **To change physics parameters:** Adjust the `useState` default values and ranges within the specific simulation component.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
