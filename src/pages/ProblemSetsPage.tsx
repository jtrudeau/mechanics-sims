import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { SolutionUnlock, SolutionsLockedNote } from '../components/SolutionUnlock';
import {
  isMultiStep,
  problemCount,
  problemSets,
} from '../content/problemSets';
import { TOPIC_GROUP_LABELS } from '../content/simulations';
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
              {set.problems.map((problem, i) =>
                isMultiStep(problem) ? (
                  <MultiStepCard
                    key={problem.id}
                    index={i + 1}
                    problem={problem}
                    progress={progress}
                    onCheck={record}
                    unlocked={unlocked}
                  />
                ) : (
                  <ProblemCard
                    key={problem.id}
                    index={i + 1}
                    problem={problem}
                    record={progress[problem.id]}
                    onCheck={record}
                    unlocked={unlocked}
                  />
                )
              )}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

