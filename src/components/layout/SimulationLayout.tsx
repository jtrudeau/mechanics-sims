import React, { ReactNode } from 'react';

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>{title}</h1>
          <p className="text-muted textbook-font">{description}</p>
        </div>
        {actionsContent && (
          <div style={{ display: 'flex', gap: '12px' }}>
            {actionsContent}
          </div>
        )}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Main Canvas Area */}
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {canvasContent}
        </div>

        {/* Guided Companion Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Pedagogical Framing */}
          <div className="glass-panel textbook-font" style={{ backgroundColor: '#f8fafc', borderLeft: '4px solid #0ea5e9' }}>
            {theoryContent}
          </div>

          {/* Controls */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '16px', marginBottom: '16px', fontFamily: 'var(--font-ui)' }}>Interactive Parameters</h2>
            {controlsContent}
          </div>

          {/* Live Metrics */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '16px', marginBottom: '16px', fontFamily: 'var(--font-ui)' }}>Live Dynamics</h2>
            {metricsContent}
          </div>
          
        </div>
      </div>
    </div>
  );
}
