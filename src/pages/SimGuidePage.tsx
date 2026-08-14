import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FlaskConical } from 'lucide-react';
import { MathText } from '../components/MathText';
import { getSimulation, TOPIC_GROUP_LABELS } from '../content/simulations';
import { usePageTitle } from '../hooks/usePageTitle';
import { simPathWithParams, useQuizMode } from '../hooks/useQuerySeed';

export default function SimGuidePage() {
  const { slug = '' } = useParams();
  const sim = getSimulation(slug);
  const quiz = useQuizMode();

  usePageTitle(sim ? `Tips: ${sim.shortTitle} · SN1 Mechanics` : 'Tips & Revision · SN1 Mechanics');

  if (!sim) {
    return <Navigate to="/" replace />;
  }

  const { guide } = sim;

  return (
    <div className="guide-page">
      <div className="guide-topbar">
        <Link to="/" className="guide-back">
          <ArrowLeft size={16} />
          All simulations
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {quiz && <span className="topic-chip quiz-chip">Quiz mode</span>}
          <span className="topic-chip">{TOPIC_GROUP_LABELS[sim.topicGroup]}</span>
        </div>
      </div>

      <header className="guide-header">
        <h1>Tips &amp; Revision</h1>
        <p className="guide-sim-title">{sim.title}</p>
        <p className="text-muted textbook-font" style={{ maxWidth: 640 }}>
          {sim.blurb}
        </p>
        <div className="guide-cta-row">
          <Link to={sim.simPath} className="btn-link">
            <ExternalLink size={16} />
            Open simulation
          </Link>
          {!quiz && (
            <Link to={`${sim.guidePath}?quiz=1`} className="btn-link secondary">
              Quiz mode
            </Link>
          )}
          {quiz && (
            <Link to={sim.guidePath} className="btn-link secondary">
              Show answers
            </Link>
          )}
        </div>
      </header>

      <div className="guide-grid">
        <section className="glass-panel guide-section">
          <h2>Learning goals</h2>
          <ul className="guide-list">
            {guide.learningGoals.map((g) => (
              <li key={g}>
                <MathText text={g} />
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-panel guide-section">
          <h2>Operating notes</h2>
          <ol className="guide-list numbered">
            {guide.howToUse.map((step) => (
              <li key={step}>
                <MathText text={step} />
              </li>
            ))}
          </ol>
        </section>

        <section className="glass-panel guide-section">
          <h2>Common difficulties</h2>
          <ul className="guide-list watch">
            {guide.watchFors.map((w) => (
              <li key={w}>
                <MathText text={w} />
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-panel guide-section">
          <h2>Reading the figure</h2>
          <ul className="guide-list">
            {guide.canvasTips.map((t) => (
              <li key={t}>
                <MathText text={t} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="guide-problems">
        <div className="home-section-head">
          <h2>Revision problems</h2>
          <p className="text-muted">
            {quiz
              ? 'Answer sections are hidden. Use Load setup to open the simulation with the parameters for each problem.'
              : 'Work each problem before revealing the hint or solution. Load setup opens the simulation with matching controls.'}
          </p>
        </div>

        <div className="guide-problem-list">
          {guide.revisionProblems.map((problem, index) => (
            <article key={problem.id} className="glass-panel guide-problem">
              <h3>
                <span className="guide-problem-num">{index + 1}</span>
                <span className="guide-problem-prompt">
                  <MathText text={problem.prompt} />
                </span>
              </h3>

              <div className="guide-check">
                <strong>With the simulation</strong>
                <ol>
                  {problem.checkWithSim.map((c) => (
                    <li key={c}>
                      <MathText text={c} />
                    </li>
                  ))}
                </ol>
                {problem.simParams && (
                  <Link
                    to={simPathWithParams(sim.simPath, problem.simParams)}
                    className="btn-link secondary"
                    style={{ marginTop: 10 }}
                  >
                    <FlaskConical size={15} />
                    Load setup
                  </Link>
                )}
              </div>

              {!quiz && (
                <>
                  <details className="guide-reveal">
                    <summary>Hint</summary>
                    <p>
                      <MathText text={problem.hint} />
                    </p>
                  </details>

                  <details className="guide-reveal answer">
                    <summary>Solution</summary>
                    <p>
                      <MathText text={problem.answer} />
                    </p>
                  </details>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <div className="guide-footer-cta glass-panel">
        <p className="textbook-font" style={{ margin: 0 }}>
          Return to the live figure when ready.
        </p>
        <Link to={sim.simPath} className="btn-link">
          {sim.shortTitle}
        </Link>
      </div>
    </div>
  );
}
