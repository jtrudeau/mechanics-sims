import { useState } from 'react';
import { SolutionUnlock, SolutionsLockedNote } from '../SolutionUnlock';
import { problemSets, isMultiStep } from '../../content/problemSets';
import { useTeacherUnlock } from '../../hooks/useTeacherUnlock';
import {
  loadProgress,
  saveProgress,
  ProblemCard,
  MultiStepCard,
  type ProgressMap,
} from '../problems/ProblemCards';

export function TopicProblemsView({
  slug,
  onLoadSetup,
}: {
  slug: string;
  onLoadSetup?: (params?: Record<string, string | number | boolean>) => void;
}) {
  const set = problemSets.find((s) => s.simSlug === slug);
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());
  const { unlocked } = useTeacherUnlock();

  if (!set) {
    return (
      <div className="glass-panel" style={{ padding: 24, textAlign: 'center' }}>
        <p className="text-muted">No dedicated problem set configured for this simulation yet.</p>
      </div>
    );
  }

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

  return (
    <div className="problems-page in-topic-hub" style={{ padding: 0 }}>
      <header className="glass-panel problems-hero" style={{ marginTop: 0 }}>
        <p className="home-eyebrow">Practice &amp; Homework</p>
        <h2>{set.title}</h2>
        <p className="home-lede textbook-font">
          {set.blurb} Work numerically or by multiple choice. Hints and board-style worked solutions remain
          locked until unlocked by your teacher.
        </p>
      </header>

      <div style={{ marginTop: 20 }}>
        {!unlocked && <SolutionsLockedNote />}
        <SolutionUnlock compact />
      </div>

      <section className="problem-set-block" style={{ marginTop: 20 }}>
        <ol className="problems-list">
          {set.problems.map((problem, index) =>
            isMultiStep(problem) ? (
              <MultiStepCard
                key={problem.id}
                index={index + 1}
                problem={problem}
                progress={progress}
                onCheck={record}
                unlocked={unlocked}
                onLoadSetup={onLoadSetup}
              />
            ) : (
              <ProblemCard
                key={problem.id}
                index={index + 1}
                problem={problem}
                record={progress[problem.id]}
                onCheck={record}
                unlocked={unlocked}
                onLoadSetup={onLoadSetup}
              />
            )
          )}
        </ol>
      </section>
    </div>
  );
}
