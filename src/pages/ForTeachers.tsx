import { Link } from 'react-router-dom';
import { SolutionUnlock } from '../components/SolutionUnlock';
import { forTeachers } from '../content/forTeachers';
import { TOPIC_GROUP_LABELS, TOPIC_GROUP_ORDER } from '../content/simulations';
import { usePageTitle } from '../hooks/usePageTitle';

export default function ForTeachers() {
  usePageTitle('For Teachers · SN1 Mechanics');

  const {
    suiteTitle,
    courseLine,
    purpose,
    scopeNotes,
    activityPattern,
    revisionUse,
    classroomLogistics,
    simIndex,
    suggestedSequence,
  } = forTeachers;

  const grouped = TOPIC_GROUP_ORDER.map((group) => ({
    group,
    items: simIndex.filter((s) => s.topicGroup === group),
  }));

  return (
    <div className="teachers-page">
      <header className="teachers-hero glass-panel">
        <p className="home-eyebrow">Instructor guide</p>
        <h1>{suiteTitle}</h1>
        <p className="home-lede textbook-font">{courseLine}</p>
      </header>

      <SolutionUnlock />

      <div className="teachers-grid">
        <section className="glass-panel">
          <h2>Purpose</h2>
          <ul className="guide-list">
            {purpose.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>

        <section className="glass-panel">
          <h2>Scope</h2>
          <ul className="guide-list">
            {scopeNotes.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="glass-panel teachers-activity">
        <h2>{activityPattern.title}</h2>
        <div className="teachers-steps">
          {activityPattern.steps.map((step) => (
            <div key={step.name} className="teachers-step">
              <h3>{step.name}</h3>
              <p className="text-muted">{step.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel">
        <h2>Suggested sequence</h2>
        <ol className="guide-list numbered">
          {suggestedSequence.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      <div className="teachers-grid">
        <section className="glass-panel">
          <h2>Revision problems</h2>
          <ul className="guide-list">
            {revisionUse.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div style={{ marginTop: 14 }}>
            <Link to="/problems" className="btn-link">
              Open student problem sets
            </Link>
          </div>
        </section>

        <section className="glass-panel">
          <h2>Classroom use</h2>
          <ul className="guide-list">
            {classroomLogistics.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="teachers-index">
        <div className="home-section-head">
          <h2>Simulation index</h2>
          <p className="text-muted">Open a simulation or its Tips &amp; practice tab.</p>
        </div>

        {grouped.map(({ group, items }) => (
          <div key={group} className="teachers-index-group">
            <h3 className="nav-group-label" style={{ marginBottom: 10 }}>
              {TOPIC_GROUP_LABELS[group]}
            </h3>
            <div className="teachers-index-list">
              {items.map((sim) => (
                <div key={sim.simPath} className="glass-panel teachers-index-row">
                  <div>
                    <strong>{sim.title}</strong>
                    <p className="text-muted">{sim.goal}</p>
                  </div>
                  <div className="home-card-actions">
                    <Link to={sim.simPath} className="btn-link">
                      Open simulation
                    </Link>
                    <Link to={`${sim.simPath}?tab=practice`} className="btn-link secondary">
                      Tips &amp; practice
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <p className="text-muted" style={{ fontSize: 13 }}>
        Authorship and contact:{' '}
        <Link to="/about" style={{ color: 'var(--primary)' }}>
          About
        </Link>
        .
      </p>
    </div>
  );
}
