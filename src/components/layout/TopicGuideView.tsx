import { FlaskConical } from 'lucide-react';
import { MathText } from '../MathText';
import { SolutionUnlock, SolutionsLockedNote } from '../SolutionUnlock';
import type { SimulationEntry, RevisionProblem } from '../../content/types';
import { useQuizMode } from '../../hooks/useQuerySeed';
import { useTeacherUnlock } from '../../hooks/useTeacherUnlock';

export function TopicGuideView({
  sim,
  onLoadSetup,
}: {
  sim: SimulationEntry;
  onLoadSetup?: (params?: Record<string, string | number | boolean>) => void;
}) {
  const quiz = useQuizMode();
  const { unlocked } = useTeacherUnlock();
  const showAnswers = unlocked && !quiz;
  const { guide } = sim;

  return (
    <div className="guide-page in-topic-hub" style={{ padding: 0 }}>
      <header className="guide-header glass-panel" style={{ marginTop: 0 }}>
        <p className="home-eyebrow">Tips &amp; practice</p>
        <h2>{sim.title}</h2>
        <p className="text-muted textbook-font">
          <MathText text={sim.blurb} />
        </p>
      </header>

      <div className="guide-grid">
        <section className="glass-panel guide-section">
          <h2>Learning goals</h2>
          <ul className="guide-list">
            {guide.learningGoals.map((g: string) => (
              <li key={g}>
                <MathText text={g} />
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-panel guide-section">
          <h2>Operating notes</h2>
          <ol className="guide-list numbered">
            {guide.howToUse.map((step: string) => (
              <li key={step}>
                <MathText text={step} />
              </li>
            ))}
          </ol>
        </section>

        <section className="glass-panel guide-section">
          <h2>Common difficulties</h2>
          <ul className="guide-list watch">
            {guide.watchFors.map((w: string) => (
              <li key={w}>
                <MathText text={w} />
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-panel guide-section">
          <h2>Reading the figure</h2>
          <ul className="guide-list">
            {guide.canvasTips.map((t: string) => (
              <li key={t}>
                <MathText text={t} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {guide.tryThis && (
        <section className="glass-panel guide-section" style={{ marginTop: 24 }}>
          <h2>Suggested exercise</h2>
          <p className="textbook-font" style={{ margin: 0 }}>
            <MathText text={guide.tryThis} />
          </p>
        </section>
      )}

      <section className="guide-problems" style={{ marginTop: 24 }}>
        <div className="home-section-head">
          <h2>Formative Revision Problems</h2>
          <p className="text-muted">
            {quiz
              ? 'Quiz mode keeps hints and solutions hidden on this page, including after unlock.'
              : showAnswers
                ? 'Work each problem before opening the hint or solution. Load setup applies matching controls to the simulation.'
                : 'Work each problem, then Load setup to test with the simulation. Hints and solutions stay hidden until unlocked.'}
          </p>
        </div>
        {!quiz && !showAnswers && <SolutionsLockedNote />}
        {!quiz && <SolutionUnlock compact />}
        {quiz && unlocked && (
          <p className="solutions-locked-note">
            This tab is unlocked, but quiz mode is active — answers stay hidden for classroom projection.
          </p>
        )}

        <div className="guide-problem-list">
          {guide.revisionProblems.map((problem: RevisionProblem, index: number) => (
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
                  {problem.checkWithSim.map((c: string) => (
                    <li key={c}>
                      <MathText text={c} />
                    </li>
                  ))}
                </ol>
                {problem.simParams && (
                  <button
                    type="button"
                    onClick={() => onLoadSetup?.(problem.simParams)}
                    className="btn-link secondary"
                    style={{ marginTop: 10 }}
                  >
                    <FlaskConical size={15} />
                    Load setup into simulation
                  </button>
                )}
              </div>

              {showAnswers && (
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
    </div>
  );
}
