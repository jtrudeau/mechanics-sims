
export default function Home() {
  return (
    <div>
      <h1>SN1 Mechanics Simulations</h1>
      <p className="text-muted" style={{ marginBottom: '24px' }}>
        Select a simulation from the sidebar to explore the interactive physics experiments.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-panel">
          <h2>About this Suite</h2>
          <p className="text-muted" style={{ lineHeight: 1.6 }}>
            These simulations are designed to map mathematical representations directly to physical phenomena. 
            By interacting with parameters like mass, force, and initial velocity, you can build a strong 
            intuition for classical mechanics.
          </p>
        </div>
        
        <div className="glass-panel">
          <h2>Topics Covered</h2>
          <ul className="text-muted" style={{ paddingLeft: '20px', lineHeight: 1.6 }}>
            <li>1D Kinematics & Instantaneous Velocity</li>
            <li>1D Dynamics & Friction</li>
            <li>2D Dynamics & Circular Motion</li>
            <li>Newton's 3rd Law & Interacting Objects</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
