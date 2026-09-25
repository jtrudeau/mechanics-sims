import { Link } from 'react-router-dom';
import {
  Activity,
  Box,
  Circle,
  ArrowRight,
  Gauge,
  Scale,
  Mountain,
  RotateCw,
  GraduationCap,
  LineChart,
  Orbit,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import { simulations, TOPIC_GROUP_LABELS } from '../content/simulations';
import type { SimIconName } from '../content/types';
import { usePageTitle } from '../hooks/usePageTitle';
import { MathText } from '../components/MathText';

const ICON_MAP: Record<SimIconName, LucideIcon> = {
  activity: Activity,
  box: Box,
  circle: Circle,
  'arrow-right': ArrowRight,
  gauge: Gauge,
  scale: Scale,
  mountain: Mountain,
  'rotate-cw': RotateCw,
  chart: LineChart,
  orbit: Orbit,
};

export default function Home() {
  usePageTitle('SN1 Mechanics Simulations');

  return (
    <div className="home-page">
      <section className="home-hero glass-panel">
        <p className="home-eyebrow">203-SN1-RE · Classical mechanics</p>
        <h1>SN1 Mechanics Simulations</h1>
        <p className="home-lede textbook-font">
          Interactive figures that relate mathematical representations—equations, free-body
          diagrams, and graphs—to the motion under study. Start with kinematics graphs, then
          forces, energy, and rotation. Problem sets check numerical answers in the browser.
        </p>
        <div className="home-cta-row">
          <a href="#simulations" className="btn-link">
            Browse simulations
          </a>
          <Link to="/problems" className="btn-link">
            <ClipboardList size={16} />
            Problem sets
          </Link>
          <Link to="/for-teachers" className="btn-link secondary">
            <GraduationCap size={16} />
            For teachers
          </Link>
        </div>
      </section>

      <section className="home-flow">
        <div className="home-flow-step">
          <span className="home-flow-num">1</span>
          <div>
            <strong>Predict</strong>
            <p className="text-muted">State an expected outcome before adjusting a control.</p>
          </div>
        </div>
        <div className="home-flow-step">
          <span className="home-flow-num">2</span>
          <div>
            <strong>Observe</strong>
            <p className="text-muted">Compare the canvas and Live Dynamics with your prediction.</p>
          </div>
        </div>
        <div className="home-flow-step">
          <span className="home-flow-num">3</span>
          <div>
            <strong>Explain</strong>
            <p className="text-muted">Use Tips &amp; practice to refine the physical argument.</p>
          </div>
        </div>
      </section>

      <section id="simulations" className="home-sims">
        <div className="home-section-head">
          <h2>Simulations</h2>
          <p className="text-muted">
            {simulations.length} topics spanning kinematics, Newton’s laws, energy, and rotation.
          </p>
        </div>

        <div className="home-card-grid">
          {simulations.map((sim) => {
            const Icon = ICON_MAP[sim.icon];
            return (
              <article key={sim.slug} className="home-card glass-panel">
                <div className="home-card-top">
                  <span className="topic-chip">{TOPIC_GROUP_LABELS[sim.topicGroup]}</span>
                  <Icon size={18} className="home-card-icon" />
                </div>
                <h3>{sim.shortTitle}</h3>
                <p className="text-muted home-card-blurb"><MathText text={sim.blurb} /></p>
                <div className="home-card-actions">
                  <Link to={sim.simPath} className="btn-link">
                    Open simulation
                  </Link>
                  <Link to={`${sim.simPath}?tab=practice`} className="btn-link secondary">
                    Tips &amp; practice
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="glass-panel problems-hero" style={{ marginTop: 8 }}>
        <h2 style={{ marginBottom: 8 }}>Problem sets</h2>
        <p className="text-muted textbook-font" style={{ maxWidth: 640 }}>
          Checkable short items, then a multi-step homework / class problem on each topic. Load
          setup opens the matching simulation with the problem’s parameters.
        </p>
        <div className="home-card-actions" style={{ marginTop: 14 }}>
          <Link to="/problems" className="btn-link">
            <ClipboardList size={16} />
            Work the problem sets
          </Link>
        </div>
      </section>

      <p className="text-muted" style={{ fontSize: 13 }}>
        Joel Trudeau, Dawson College Physics.{' '}
        <Link to="/about" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          About
        </Link>
      </p>
    </div>
  );
}
