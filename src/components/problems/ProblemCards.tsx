import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, FlaskConical, X } from 'lucide-react';
import { MathText } from '../MathText';
import { ProblemFigure } from '../figures/ProblemFigures';
import type { MultiStepProblem, StudentProblem } from '../../content/problemSets';
import { simPathWithParams } from '../../hooks/useQuerySeed';

export const STORAGE_KEY = 'sn1-problem-progress-v1';

export type ProgressMap = Record<string, { status: 'correct' | 'wrong'; attempts: number }>;

export function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

export function saveProgress(map: ProgressMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function numericOk(input: string, answer: number, tol = 0.08) {
  const n = Number(input.replace(/,/g, '').trim());
  if (!Number.isFinite(n)) return false;
  const abs = Math.max(tol, 0.02 * Math.abs(answer), 0.04);
  return Math.abs(n - answer) <= abs;
}

export function ProblemCard({
  index,
  problem,
  record,
  onCheck,
  unlocked,
  nested = false,
  onLoadSetup,
}: {
  index?: number;
  problem: StudentProblem;
  record?: { status: 'correct' | 'wrong'; attempts: number };
  onCheck: (id: string, ok: boolean) => void;
  unlocked: boolean;
  nested?: boolean;
  onLoadSetup?: (params?: Record<string, string | number | boolean>) => void;
}) {
  const [input, setInput] = useState('');
  const [choice, setChoice] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>(record?.status ?? 'idle');
  const [copied, setCopied] = useState(false);

  const copyPrompt = () => {
    let text = problem.prompt;
    if (problem.choices && problem.choices.length > 0) {
      text += '\n' + problem.choices.map((c, i) => `(${String.fromCharCode(97 + i)}) ${c.label}`).join('\n');
    }
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <li
      className={`problems-card${nested ? ' is-part' : ''}${feedback === 'correct' ? ' is-correct' : ''}${
        feedback === 'wrong' ? ' is-wrong' : ''
      }`}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <h3 style={{ margin: 0, flex: 1 }}>
          {!nested && index != null && <span className="guide-problem-num">{index}</span>}
          <span className="guide-problem-prompt">
            <MathText text={problem.prompt} />
          </span>
        </h3>
        <button
          type="button"
          onClick={copyPrompt}
          title={copied ? 'Copied to clipboard!' : 'Copy problem text'}
          aria-label="Copy problem text"
          style={{
            padding: '4px 6px',
            background: 'transparent',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: copied ? 'var(--color-vel, #0284c7)' : 'var(--text-muted, #64748b)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            flexShrink: 0,
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied && <span>Copied</span>}
        </button>
      </div>

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

      {unlocked && (
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
              <MathText text={problem.solution} />
            </p>
          </details>
        </>
      )}

      {onLoadSetup && problem.simParams ? (
        <div style={{ marginTop: 8 }}>
          {problem.relatedCheckNote && (
            <p className="text-muted textbook-font" style={{ margin: '0 0 8px', fontSize: 13 }}>
              <MathText text={problem.relatedCheckNote} />
            </p>
          )}
          <button
            type="button"
            onClick={() => onLoadSetup(problem.simParams)}
            className="btn-link secondary"
          >
            <FlaskConical size={15} />
            {problem.simButtonLabel ? (
              <MathText text={problem.simButtonLabel} />
            ) : (
              'Load setup into simulation'
            )}
          </button>
        </div>
      ) : simPath ? (
        <div style={{ marginTop: 8 }}>
          {problem.relatedCheckNote && (
            <p className="text-muted textbook-font" style={{ margin: '0 0 8px', fontSize: 13 }}>
              <MathText text={problem.relatedCheckNote} />
            </p>
          )}
          <Link to={simPath} className="btn-link secondary">
            <FlaskConical size={15} />
            {problem.simButtonLabel ? (
              <MathText text={problem.simButtonLabel} />
            ) : (
              'Load setup'
            )}
          </Link>
        </div>
      ) : null}
    </li>
  );
}

export function MultiStepCard({
  index,
  problem,
  progress,
  onCheck,
  unlocked,
  onLoadSetup,
}: {
  index: number;
  problem: MultiStepProblem;
  progress: ProgressMap;
  onCheck: (id: string, ok: boolean) => void;
  unlocked: boolean;
  onLoadSetup?: (params?: Record<string, string | number | boolean>) => void;
}) {
  const simPath = problem.simSlug
    ? simPathWithParams(`/simulations/${problem.simSlug}`, problem.simParams)
    : null;
  const partCorrect = problem.parts.filter((p) => progress[p.id]?.status === 'correct').length;
  const [copied, setCopied] = useState(false);

  const copyMultiStep = () => {
    const text = `${problem.title}\n\n${problem.stem}\n\n` +
      problem.parts.map((p, idx) => `(${String.fromCharCode(97 + idx)}) ${p.prompt}`).join('\n\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <li className="problems-card problems-multistep">
      <div className="problems-multistep-head">
        <span className="guide-problem-num">{index}</span>
        <div>
          <span className="topic-chip">Homework / class</span>
          <h3>{problem.title}</h3>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="text-muted" style={{ fontSize: 13 }}>
            {partCorrect} / {problem.parts.length} parts
          </span>
          <button
            type="button"
            onClick={copyMultiStep}
            title={copied ? 'Copied to clipboard!' : 'Copy homework problem text'}
            aria-label="Copy homework problem text"
            style={{
              padding: '4px 6px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: copied ? 'var(--color-vel, #0284c7)' : 'var(--text-muted, #64748b)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied && <span>Copied</span>}
          </button>
        </div>
      </div>

      {problem.figure && <ProblemFigure id={problem.figure} />}

      <div className="problems-stem textbook-font">
        <MathText text={problem.stem} />
      </div>

      {problem.source && (
        <p className="problem-source">
          {problem.source.url ? (
            <a href={problem.source.url} target="_blank" rel="noreferrer">
              {problem.source.credit}
            </a>
          ) : (
            problem.source.credit
          )}
        </p>
      )}

      {onLoadSetup && problem.simParams ? (
        <div style={{ marginBottom: 12 }}>
          {problem.relatedCheckNote && (
            <p className="text-muted textbook-font" style={{ margin: '0 0 8px', fontSize: 13 }}>
              <MathText text={problem.relatedCheckNote} />
            </p>
          )}
          <button
            type="button"
            onClick={() => onLoadSetup(problem.simParams)}
            className="btn-link secondary"
          >
            <FlaskConical size={15} />
            {problem.simButtonLabel ? (
              <MathText text={problem.simButtonLabel} />
            ) : (
              'Open related simulation'
            )}
          </button>
        </div>
      ) : simPath ? (
        <div style={{ marginBottom: 12 }}>
          {problem.relatedCheckNote && (
            <p className="text-muted textbook-font" style={{ margin: '0 0 8px', fontSize: 13 }}>
              <MathText text={problem.relatedCheckNote} />
            </p>
          )}
          <Link to={simPath} className="btn-link secondary">
            <FlaskConical size={15} />
            {problem.simButtonLabel ? (
              <MathText text={problem.simButtonLabel} />
            ) : (
              'Open related simulation'
            )}
          </Link>
        </div>
      ) : null}

      <ol className="problems-parts">
        {problem.parts.map((part) => (
          <ProblemCard
            key={part.id}
            problem={part}
            record={progress[part.id]}
            onCheck={onCheck}
            unlocked={unlocked}
            onLoadSetup={onLoadSetup}
            nested
          />
        ))}
      </ol>

      {unlocked && problem.teacherSolution && problem.teacherSolution.length > 0 && (
        <details className="guide-reveal answer" style={{ marginTop: 12 }}>
          <summary>Teacher solution</summary>
          <div className="teacher-solution textbook-font">
            {problem.teacherSolution.map((para, i) => (
              <p key={i}>
                <MathText text={para} />
              </p>
            ))}
          </div>
        </details>
      )}
    </li>
  );
}
