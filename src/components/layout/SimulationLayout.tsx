import { type ReactNode } from 'react';

interface SimulationLayoutProps {
  title: string;
  description: string;
  canvasContent: ReactNode;
  theoryContent: ReactNode;
  controlsContent: ReactNode;
  metricsContent: ReactNode;
  actionsContent?: ReactNode;
}

export function SimulationLayout({
  title,
  description,
  canvasContent,
  theoryContent,
  controlsContent,
  metricsContent,
  actionsContent
}: SimulationLayoutProps) {
  return (
    <div className="sim-layout">

      {/* Canvas Column */}
      <div className="sim-canvas-col">
        <div className="sim-header">
          <div>
            <h1>{title}</h1>
            <p className="text-muted textbook-font">{description}</p>
          </div>
          {actionsContent && (
            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
              {actionsContent}
            </div>
          )}
        </div>
        <div className="glass-panel sim-canvas-panel">
          {canvasContent}
        </div>
      </div>

      {/* Guided Companion Column — sticky + independently scrollable */}
      <div className="sim-companion">

        <div className="glass-panel sim-theory-panel textbook-font">
          {theoryContent}
        </div>

        <div className="glass-panel">
          <h2 className="sim-section-heading">Interactive Parameters</h2>
          {controlsContent}
        </div>

        <div className="glass-panel">
          <h2 className="sim-section-heading">Live Dynamics</h2>
          {metricsContent}
        </div>

      </div>
    </div>
  );
}
