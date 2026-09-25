import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { simPathWithParams } from '../hooks/useQuerySeed';
import { SolutionUnlock, SolutionsLockedNote } from '../components/SolutionUnlock';
import {
  isMultiStep,
  problemCount,
  problemSets,
} from '../content/problemSets';
import { getSimulation, TOPIC_GROUP_LABELS, TOPIC_GROUP_ORDER } from '../content/simulations';
import { MathText } from '../components/MathText';
import type { TopicGroup } from '../content/types';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTeacherUnlock } from '../hooks/useTeacherUnlock';

import {
  loadProgress,
  saveProgress,
  STORAGE_KEY,
  ProblemCard,
  MultiStepCard,
  type ProgressMap,
} from '../components/problems/ProblemCards';

export default function ProblemSetsPage() {
  usePageTitle('Problem sets · SN1 Mechanics');
  const [searchParams, setSearchParams] = useSearchParams();
  const topic = (searchParams.get('topic') ?? 'all') as TopicGroup | 'all';
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());
  const { unlocked } = useTeacherUnlock();
  const [pane, setPane] = useState<{
    slug: string;
    params?: Record<string, string | number | boolean>;
  } | null>(null);

  const openPane = (slug: string, params?: Record<string, string | number | boolean>) => {
    setPane({ slug, params });
  };

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

  const paneTarget = pane ?? (sets[0]?.simSlug ? { slug: sets[0].simSlug } : null);
  const paneSim = paneTarget ? getSimulation(paneTarget.slug) : undefined;
  const paneSrc = paneTarget
    ? simPathWithParams(`/simulations/${paneTarget.slug}`, { ...(paneTarget.params ?? {}), embed: 1 })
    : '';

  return (
    <div className="problems-page">
      <header className="glass-panel problems-hero">
        <p className="home-eyebrow">Student practice</p>
        <h1>Problem sets</h1>
        <p className="home-lede textbook-font">
          Work numerically or by multiple choice, then check. After the short items, each
          topic has a multi-step homework / class problem. Progress is stored in this browser
          only. Hints and worked solutions stay hidden until a teacher unlocks them.
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
        <SolutionUnlock compact />
        {!unlocked && <SolutionsLockedNote />}
      </header>

      <div className="problems-filters">
        <button type="button" className={topic === 'all' ? '' : 'secondary'} onClick={() => setTopic('all')}>
          All topics
        </button>
        {TOPIC_GROUP_ORDER.map((g) => (
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

      <div className="problems-workspace">
        <div className="problems-questions">
          <div className="problems-sets">
            {sets.map((set) => (
              <section key={set.id} className="glass-panel problems-set">
                <div className="problems-set-head">
                  <div>
                    <span className="topic-chip">{TOPIC_GROUP_LABELS[set.topicGroup]}</span>
                    <h2>{set.title}</h2>
                    <p className="text-muted textbook-font"><MathText text={set.blurb} /></p>
                  </div>
                  {set.simSlug && (
                    <button type="button" className="secondary" onClick={() => openPane(set.simSlug as string)}>
                      Open simulation
                    </button>
                  )}
                </div>
                <ol className="problems-list">
                  {set.problems.map((problem, i) =>
                    isMultiStep(problem) ? (
                      <MultiStepCard
                        key={problem.id}
                        index={i + 1}
                        problem={problem}
                        progress={progress}
                        onCheck={record}
                        unlocked={unlocked}
                        onOpenInPane={openPane}
                      />
                    ) : (
                      <ProblemCard
                        key={problem.id}
                        index={i + 1}
                        problem={problem}
                        record={progress[problem.id]}
                        onCheck={record}
                        unlocked={unlocked}
                        onOpenInPane={openPane}
                      />
                    )
                  )}
                </ol>
              </section>
            ))}
          </div>
        </div>
        {paneTarget && (
          <aside className="problems-sim-pane glass-panel">
            <div className="problems-sim-pane-head">
              <h2>{paneSim?.shortTitle ?? 'Simulation'}</h2>
              <p className="text-muted">The canvas stays here and loads the setup from Open simulation.</p>
            </div>
            <iframe
              key={paneSrc}
              className="problems-sim-frame"
              title={`${paneSim?.shortTitle ?? 'Simulation'} canvas`}
              src={paneSrc}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

