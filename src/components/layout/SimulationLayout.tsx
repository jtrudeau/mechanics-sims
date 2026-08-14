import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, ChevronDown, ChevronRight, Maximize2, Minimize2, SlidersHorizontal } from 'lucide-react';
import { MathText } from '../MathText';
import { getSimulation } from '../../content/simulations';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useLayout } from './LayoutContext';

interface SimulationLayoutProps {
  title: string;
  description: string;
  slug?: string;
  canvasContent: ReactNode;
  theoryContent: ReactNode;
  controlsContent: ReactNode;
  metricsContent: ReactNode;
  actionsContent?: ReactNode;
  /** When true (Play), the canvas widens: sidebar + companion collapse. */
  running?: boolean;
}

export function SimulationLayout({
  title,
  description,
  slug,
  canvasContent,
  theoryContent,
  controlsContent,
  metricsContent,
  actionsContent,
  running = false,
}: SimulationLayoutProps) {
  const entry = slug ? getSimulation(slug) : undefined;
  const [theoryOpen, setTheoryOpen] = useState(false);
  const { wideCanvas, setWideCanvas, setSidebarCollapsed } = useLayout();

  usePageTitle(entry ? `${entry.shortTitle} · SN1 Mechanics` : `${title} · SN1 Mechanics`);

  useEffect(() => {
    if (running) {
      setWideCanvas(true);
      setSidebarCollapsed(true);
    }
  }, [running, setWideCanvas, setSidebarCollapsed]);

  const toggleWide = () => {
    setWideCanvas((w) => {
      const next = !w;
      if (next) setSidebarCollapsed(true);
      return next;
    });
  };

  return (
    <div className={`sim-layout${wideCanvas ? ' is-wide' : ''}`}>
      <div className="sim-canvas-col">
        <div className="sim-header">
          <div className="sim-header-copy">
            <h1>{title}</h1>
            <p className="text-muted textbook-font">{description}</p>
          </div>
          <div className="sim-header-actions">
            {entry && (
              <Link to={entry.guidePath} className="btn-link secondary">
                <BookMarked size={16} />
                Tips &amp; Revision
              </Link>
            )}
            {actionsContent}
            <button
              type="button"
              className="secondary"
              onClick={toggleWide}
              title={wideCanvas ? 'Show parameters' : 'Widen canvas'}
            >
              {wideCanvas ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              {wideCanvas ? 'Show panels' : 'Widen canvas'}
            </button>
          </div>
        </div>
        <div className="glass-panel sim-canvas-panel">{canvasContent}</div>
      </div>

      {wideCanvas && (
        <button
          type="button"
          className="sim-companion-tab"
          onClick={() => setWideCanvas(false)}
          title="Show parameters and live dynamics"
        >
          <SlidersHorizontal size={16} />
          Panels
        </button>
      )}

      <div className="sim-companion">
        {entry?.guide.tryThis && (
          <div className="glass-panel sim-try-this">
            <h2 className="sim-section-heading">Suggested exercise</h2>
            <p className="textbook-font" style={{ margin: 0 }}>
              <MathText text={entry.guide.tryThis} />
            </p>
          </div>
        )}

        <div className="glass-panel">
          <h2 className="sim-section-heading">Parameters</h2>
          {controlsContent}
        </div>

        <div className="glass-panel">
          <h2 className="sim-section-heading">Live Dynamics</h2>
          {metricsContent}
        </div>

        <div className={`glass-panel sim-theory-panel textbook-font${theoryOpen ? '' : ' collapsed'}`}>
          <button
            type="button"
            className="theory-toggle"
            onClick={() => setTheoryOpen((o) => !o)}
            aria-expanded={theoryOpen}
          >
            {theoryOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="sim-section-heading" style={{ margin: 0 }}>
              {theoryOpen ? 'Theory' : 'Theory (expand after attempting the exercise)'}
            </span>
          </button>
          {theoryOpen && <div className="theory-body">{theoryContent}</div>}
        </div>
      </div>
    </div>
  );
}
