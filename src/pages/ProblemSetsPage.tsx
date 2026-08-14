import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, FlaskConical, RotateCcw, X } from 'lucide-react';
import { MathText } from '../components/MathText';
import { problemCount, problemSets, type StudentProblem } from '../content/problemSets';
import { TOPIC_GROUP_LABELS } from '../content/simulations';
import type { TopicGroup } from '../content/types';
import { simPathWithParams } from '../hooks/useQuerySeed';
import { usePageTitle } from '../hooks/usePageTitle';

const STORAGE_KEY = 'sn1-problem-progress-v1';

type ProgressMap = Record<string, { status: 'correct' | 'wrong'; attempts: number }>;

function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

function saveProgress(map: ProgressMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function numericOk(input: string, answer: number, tol = 0.08) {
  const n = Number(input.replace(/,/g, '').trim());
  if (!Number.isFinite(n)) return false;
  const abs = Math.max(tol, 0.02 * Math.abs(answer), 0.04);
  return Math.abs(n - answer) <= abs;
}

export default function ProblemSetsPage() {
  usePageTitle('Problem sets · SN1 Mechanics');
  const [searchParams, setSearchParams] = useSearchParams();
  const topic = (searchParams.get('topic') ?? 'all') as TopicGroup | 'all';
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());

  const sets = useMemo(
    () => (topic === 'all' ? problemSets : problemSets.filter((s) => s.topicGroup === topic)),
    [topic]
  );

  const total = problemCount();
  const correctCount = Object.values(progress).filter((p) => p.status === 'correct').length;

  const setTopic = (next: string) => {
    const sp = new URLSearchParams(searchParams);
    if (next === 'all') sp.delete('topic');
    else sp.set('topic', next);
    setSearchParams(sp, { replace: true });
  };

  const record = (id: string, ok: boolean) => {
    setProgress((prev) => {
      const next: ProgressMap = {
        ...prev,
        [id]: {
          status: ok ? 'correct' : 'wrong',
          attempts: (prev[id]?.attempts ?? 0) + 1,
        },
      };
      saveProgress(next);
      return next;
    });
  };

  const clearProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProgress({});
  };

  return (
    <div className="problems-page">
      <header className="glass-panel problems-hero">
        <p className="home-eyebrow">Student practice</p>
        <h1>Problem sets</h1>
        <p className="home-lede textbook-font">
          Work numerically or by multiple choice, then check. Each item can load the matching
          simulation. Progress is stored in this browser only.
        </p>
        <div className="problems-progress-row">
          <span className="topic-chip">
            {correctCount} / {total} correct
          </span>
          <button type="button" className="secondary" onClick={clearProgress}>
            <RotateCcw size={14} />
            Reset progress
          </button>
        </div>
      </header>

      <div className="problems-filters">
        <button type="button" className={topic === 'all' ? '' : 'secondary'} onClick={() => setTopic('all')}>
          All topics
        </button>
        {(Object.keys(TOPIC_GROUP_LABELS) as TopicGroup[]).map((g) => (
          <button
            key={g}
            type="button"
            className={topic === g ? '' : 'secondary'}
            onClick={() => setTopic(g)}
          >
            {TOPIC_GROUP_LABELS[g]}
          </button>
        ))}
      </div>

      <div className="problems-sets">
        {sets.map((set) => (
          <section key={set.id} className="glass-panel problems-set">
            <div className="problems-set-head">
              <div>
                <span className="topic-chip">{TOPIC_GROUP_LABELS[set.topicGroup]}</span>
                <h2>{set.title}</h2>
                <p className="text-muted">{set.blurb}</p>
              </div>
              {set.simSlug && (
                <Link to={`/simulations/${set.simSlug}`} className="btn-link secondary">
                  Open simulation
                </Link>
              )}
            </div>
            <ol className="problems-list">
              {set.problems.map((problem, i) => (
                <ProblemCard
                  key={problem.id}
                  index={i + 1}
                  problem={problem}
                  record={progress[problem.id]}
                  onCheck={record}
                />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

function ProblemCard({
  index,
  problem,
  record,
  onCheck,
}: {
  index: number;
  problem: StudentProblem;
  record?: { status: 'correct' | 'wrong'; attempts: number };
  onCheck: (id: string, ok: boolean) => void;
}) {
  const [input, setInput] = useState('');
  const [choice, setChoice] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>(record?.status ?? 'idle');

  const submit = () => {
    let ok = false;
    if (problem.kind === 'numeric') {
      ok = numericOk(input, Number(problem.answer), problem.tolerance);
    } else {
      ok = choice === problem.answer;
    }
    setFeedback(ok ? 'correct' : 'wrong');
    onCheck(problem.id, ok);
  };

  const simPath = problem.simSlug
    ? simPathWithParams(`/simulations/${problem.simSlug}`, problem.simParams)
    : null;

  return (
    <li className={`problems-card${feedback === 'correct' ? ' is-correct' : ''}${feedback === 'wrong' ? ' is-wrong' : ''}`}>
      <h3>
        <span className="guide-problem-num">{index}</span>
        <span className="guide-problem-prompt">
          <MathText text={problem.prompt} />
        </span>
      </h3>

      {problem.kind === 'numeric' ? (
        <div className="problems-answer-row">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Your value"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            aria-label="Numeric answer"
          />
          {problem.units && <span className="text-muted">{problem.units}</span>}
          <button type="button" onClick={submit}>
            Check
          </button>
        </div>
      ) : (
        <div className="problems-choices">
          {problem.choices?.map((c) => (
            <label key={c.id} className={`problems-choice${choice === c.id ? ' selected' : ''}`}>
              <input
                type="radio"
                name={problem.id}
                value={c.id}
                checked={choice === c.id}
                onChange={() => setChoice(c.id)}
              />
              <MathText text={c.label} />
            </label>
          ))}
          <button type="button" onClick={submit} disabled={!choice}>
            Check
          </button>
        </div>
      )}

      {feedback === 'correct' && (
        <p className="problems-feedback ok">
          <Check size={15} /> Correct
          {record?.attempts ? ` · ${record.attempts} attempt${record.attempts === 1 ? '' : 's'}` : ''}
        </p>
      )}
      {feedback === 'wrong' && (
        <p className="problems-feedback bad">
          <X size={15} /> Not yet — check units and sign, then try again.
        </p>
      )}

      <details className="guide-reveal">
        <summary>Hint</summary>
        <p>
          <MathText text={problem.hint} />
        </p>
      </details>
      {feedback !== 'idle' && (
        <details className="guide-reveal answer">
          <summary>Solution</summary>
          <p>
            <MathText text={problem.solution} />
          </p>
        </details>
      )}

      {simPath && (
        <Link to={simPath} className="btn-link secondary" style={{ marginTop: 8 }}>
          <FlaskConical size={15} />
          Load setup
        </Link>
      )}
    </li>
  );
}
