import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub;

afterEach(() => {
  cleanup();
});
import { PredictionGate } from '../src/components/pedagogy/PredictionGate';
import { MultiStepCard, ProblemCard } from '../src/components/problems/ProblemCards';
import { TopicGuideView } from '../src/components/layout/TopicGuideView';
import { forTeachers } from '../src/content/forTeachers';
import { newtonsThirdLawGuide } from '../src/content/guides/newtons-third-law';
import { rotationalKinematicsGuide } from '../src/content/guides/rotational-kinematics';
import { homeworkBySet } from '../src/content/multistepProblems';
import { predictionChallenges } from '../src/content/predictionChallenges';
import { simulations } from '../src/content/simulations';
import { TeacherUnlockProvider } from '../src/hooks/useTeacherUnlock';
import SimGuidePage from '../src/pages/SimGuidePage';
import NewtonsThirdLaw from '../src/pages/simulations/NewtonsThirdLaw';
import type { PredictionChallenge } from '../src/content/predictionChallenges';

vi.mock('../src/components/physics/drawUtils', () => ({
  drawArrow: vi.fn(() => ({ hx: 0, hy: 0 })),
  drawMixedText: vi.fn(),
  placeTipLabel: vi.fn((x: number, y: number) => ({ x, y, align: 'center', baseline: 'middle' })),
  placeLabelBeyond: vi.fn((x: number, y: number) => ({ x, y, align: 'center', baseline: 'middle' })),
  placeLabelBeside: vi.fn((x: number, y: number) => ({ x, y, align: 'center', baseline: 'middle' })),
  drawCoordinateGrid: vi.fn(),
  fitStage: vi.fn(() => ({
    ctx: new Proxy(
      {},
      {
        get: () => () => undefined,
        set: () => true,
      }
    ),
    w: 640,
    h: 500,
    s: 1,
  })),
}));

const challenge: PredictionChallenge = {
  id: 'gate-1',
  simSlug: 'friction',
  topicTitle: 'Friction',
  question: 'What is the friction force?',
  options: [
    {
      id: 'A',
      label: 'It matches the push',
      isCorrect: true,
      explanation: 'EXPLANATION_SECRET about static friction',
    },
  ],
  testSetup: { F_app: 4 },
  observePrompt: 'OBSERVE_SECRET on the readout',
};

function withRouter(ui: ReactNode, path = '/') {
  return render(
    <TeacherUnlockProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/guides/:slug" element={<SimGuidePage />} />
          <Route path="/simulations/newtons-third-law" element={<NewtonsThirdLaw />} />
          <Route path="/" element={<div>home marker</div>} />
          <Route path="*" element={ui} />
        </Routes>
      </MemoryRouter>
    </TeacherUnlockProvider>
  );
}

describe('predict then observe', () => {
  it('hides the explanation until Apply, then shows it with the observe prompt', () => {
    const onApply = vi.fn();
    render(<PredictionGate challenges={[challenge]} onApplySetup={onApply} defaultExpanded />);

    fireEvent.click(screen.getByRole('button', { name: /It matches the push/ }));
    expect(screen.queryByText(/EXPLANATION_SECRET/)).toBeNull();
    expect(screen.queryByText(/OBSERVE_SECRET/)).toBeNull();
    expect(screen.getByRole('button', { name: /It matches the push/ }).className).toContain(
      'selected-correct'
    );

    fireEvent.click(screen.getByRole('button', { name: /Apply Setup/ }));
    expect(onApply).toHaveBeenCalledWith({ F_app: 4 });
    expect(screen.getByText(/EXPLANATION_SECRET/)).toBeTruthy();
    expect(screen.getByText(/OBSERVE_SECRET/)).toBeTruthy();
  });

  it('still reveals the explanation when testSetup is missing', () => {
    const onApply = vi.fn();
    const bare = { ...challenge, id: 'gate-bare', testSetup: undefined as unknown as PredictionChallenge['testSetup'] };
    render(<PredictionGate challenges={[bare]} onApplySetup={onApply} defaultExpanded />);
    fireEvent.click(screen.getByRole('button', { name: /It matches the push/ }));
    fireEvent.click(screen.getByRole('button', { name: /Apply Setup/ }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByText(/EXPLANATION_SECRET/)).toBeTruthy();
  });
});

describe('tips page', () => {
  it('shows the suggested exercise on the guide route and the in-sim tips view', () => {
    withRouter(null, '/guides/instantaneous-velocity');
    expect(document.body.textContent).toContain('Suggested exercise');
    expect(document.body.textContent).toContain('Convergence reading');
  });

  it('shows the suggested exercise inside the topic tips tab', () => {
    const sim = simulations.find((s) => s.slug === 'instantaneous-velocity');
    if (!sim) throw new Error('missing instantaneous-velocity');
    render(
      <TeacherUnlockProvider>
        <MemoryRouter>
          <TopicGuideView sim={sim} />
        </MemoryRouter>
      </TeacherUnlockProvider>
    );
    expect(document.body.textContent).toContain('Suggested exercise');
    expect(document.body.textContent).toContain('Convergence reading');
  });

  it('sends an unknown guide slug home', () => {
    withRouter(null, '/guides/not-a-sim');
    expect(screen.getByText('home marker')).toBeTruthy();
  });
});

describe('paper homework and flywheel typesetting', () => {
  it('labels crest, incline, loop, and unwinding as related checks', () => {
    const ids = ['hw-cm-1', 'hw-fr-1', 'hw-we-1', 'hw-tx-1'] as const;
    const sets = [homeworkBySet.circular, homeworkBySet.friction, homeworkBySet.energy, homeworkBySet.torque];
    for (const [id, set] of ids.map((id, i) => [id, sets[i]] as const)) {
      const problem = set.find((p) => p.id === id);
      if (!problem) throw new Error(`missing ${id}`);
      expect(problem.simButtonLabel ?? '').toMatch(/^Related check:/);
      expect(problem.relatedCheckNote ?? '').toMatch(/Related check:/);
      expect(problem.relatedCheckNote ?? '').toMatch(/paper problem/);
    }
  });

  it('renders the crest parent related-check note (not only a nested part)', () => {
    const crest = homeworkBySet.circular.find((p) => p.id === 'hw-cm-1');
    if (!crest) throw new Error('missing crest');
    const parentNote = crest.relatedCheckNote ?? '';
    expect(parentNote).toMatch(/canvas radius is not/);
    render(
      <MemoryRouter>
        <ol>
          <MultiStepCard index={1} problem={crest} progress={{}} onCheck={() => {}} unlocked={false} />
        </ol>
      </MemoryRouter>
    );
    expect(document.body.textContent).toContain('canvas radius is not');
    expect(document.body.textContent).toContain('Related check: compare');
    expect(document.body.textContent).not.toContain('Load setup');
  });

  it('asserts the incline parent paper-problem note on hw-fr-1', () => {
    const incline = homeworkBySet.friction.find((p) => p.id === 'hw-fr-1');
    if (!incline) throw new Error('missing hw-fr-1');
    expect(incline.relatedCheckNote ?? '').toMatch(/paper problem/);
    expect(incline.parts.every((p) => !p.relatedCheckNote && !p.simButtonLabel)).toBe(true);
    render(
      <MemoryRouter>
        <ol>
          <MultiStepCard index={1} problem={incline} progress={{}} onCheck={() => {}} unlocked={false} />
        </ol>
      </MemoryRouter>
    );
    expect(document.body.textContent).toContain('paper problem');
    expect(document.body.textContent).toMatch(/Related check:/);
  });

  it('shows related-check label and note on the onLoadSetup button branch', () => {
    const crest = homeworkBySet.circular.find((p) => p.id === 'hw-cm-1');
    const part = crest?.parts.find((p) => p.id === 'hw-cm-1a');
    if (!part?.simParams || !part.relatedCheckNote || !part.simButtonLabel) {
      throw new Error('missing crest part with related-check fields');
    }
    const onLoadSetup = vi.fn();
    render(
      <MemoryRouter>
        <ol>
          <ProblemCard
            problem={part}
            onCheck={() => {}}
            unlocked={false}
            onLoadSetup={onLoadSetup}
            nested
          />
        </ol>
      </MemoryRouter>
    );
    expect(document.body.textContent).toContain('paper problem');
    expect(document.body.textContent).toContain('Related check: compare');
    expect(document.body.textContent).not.toContain('Load setup');
    const btn = document.body.querySelector('button.btn-link.secondary') as HTMLButtonElement | null;
    expect(btn).toBeTruthy();
    fireEvent.click(btn!);
    expect(onLoadSetup).toHaveBeenCalledWith(part.simParams);
  });

  it('keeps a real backslash before alpha in the flywheel part (f) solution', () => {
    const flywheel = homeworkBySet['rot-kin'].find((p) => p.id === 'hw-rk-1');
    const part = flywheel?.parts.find((p) => p.id === 'hw-rk-1f');
    if (!part || typeof part.solution !== 'string') throw new Error('missing hw-rk-1f');
    expect(part.solution).toContain('\\alpha = 0');
    expect(part.solution).not.toContain('$lpha');
  });
});

describe("Newton's third law text and canvas", () => {
  it('uses side-by-side contact only', () => {
    const blob = JSON.stringify(newtonsThirdLawGuide);
    expect(blob.toLowerCase()).not.toContain('stacked');
    expect(blob.toLowerCase()).not.toContain('incline');
    expect(blob).not.toContain('scenario');
    const meta = simulations.find((s) => s.slug === 'newtons-third-law');
    expect(meta?.blurb.toLowerCase()).not.toContain('stacked');
    expect(meta?.blurb.toLowerCase()).not.toContain('incline');
    const setup = predictionChallenges['newtons-third-law'][0].testSetup;
    expect(setup).not.toHaveProperty('scenario');
  });

  it('does not render a velocity chart', () => {
    withRouter(<NewtonsThirdLaw />, '/simulations/newtons-third-law');
    expect(document.body.textContent).not.toContain('vs time');
    expect(document.body.textContent).not.toContain('Collapse Graph');
    expect(document.querySelector('input[name="m1"]')).toBeTruthy();
  });
});

describe('teacher notes and rotational difficulties', () => {
  it('tells teachers when the explanation appears and which homework is a paper problem', () => {
    const text = JSON.stringify(forTeachers);
    expect(text).toContain('explanatory paragraph appears only after Apply setup');
    expect(text).toContain('paper problems');
  });

  it('does not put torque in the rotational kinematics difficulties', () => {
    const text = rotationalKinematicsGuide.watchFors.join(' ');
    expect(text).not.toContain('\\tau');
    expect(text).not.toContain('I\\alpha');
  });
});
