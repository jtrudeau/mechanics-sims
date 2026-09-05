import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Play, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { MathText } from '../MathText';
import type { PredictionChallenge } from '../../content/predictionChallenges';

interface PredictionGateProps {
  challenges: PredictionChallenge[];
  onApplySetup?: (setup: Record<string, unknown>) => void;
  onRunSim?: () => void;
  defaultExpanded?: boolean;
}

export function PredictionGate({
  challenges,
  onApplySetup,
  onRunSim,
  defaultExpanded = true,
}: PredictionGateProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [appliedNotice, setAppliedNotice] = useState(false);

  if (!challenges || challenges.length === 0) return null;

  const current = challenges[challengeIdx] || challenges[0];
  const selectedOptId = selectedOptions[current.id];
  const selectedOpt = current.options.find((o) => o.id === selectedOptId);

  const handleSelect = (optId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [current.id]: optId }));
    setAppliedNotice(false);
  };

  const handleApply = () => {
    if (onApplySetup && current.testSetup) {
      onApplySetup(current.testSetup);
    }
    if (onRunSim) {
      onRunSim();
    }
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 3500);
  };

  const nextChallenge = () => {
    if (challengeIdx < challenges.length - 1) {
      setChallengeIdx((i) => i + 1);
      setAppliedNotice(false);
    }
  };

  const prevChallenge = () => {
    if (challengeIdx > 0) {
      setChallengeIdx((i) => i - 1);
      setAppliedNotice(false);
    }
  };

  if (!expanded) {
    return (
      <div className="sim-challenge-minimized" onClick={() => setExpanded(true)}>
        <div className="sim-challenge-min-left">
          <Lightbulb size={16} className="text-amber-500" />
          <span className="sim-challenge-min-badge">Predict &amp; Test</span>
          <span className="sim-challenge-min-title">{current.topicTitle}: Concept Challenge</span>
        </div>
        <button
          type="button"
          className="sim-challenge-toggle-btn"
          aria-label="Expand concept challenge"
        >
          <span>Open Challenge</span>
          <ChevronDown size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="sim-challenge-gate">
      <div className="sim-challenge-header">
        <div className="sim-challenge-header-left">
          <div className="sim-challenge-icon-box">
            <Lightbulb size={17} />
          </div>
          <div>
            <div className="sim-challenge-tags">
              <span className="sim-challenge-pill">Predict · Observe · Explain</span>
              <span className="sim-challenge-subtag">{current.topicTitle}</span>
            </div>
            <h3 className="sim-challenge-heading">Concept Challenge</h3>
          </div>
        </div>

        <div className="sim-challenge-header-right">
          {challenges.length > 1 && (
            <div className="sim-challenge-pagination">
              <button
                type="button"
                className="sim-challenge-nav-btn"
                disabled={challengeIdx === 0}
                onClick={prevChallenge}
                title="Previous challenge"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="sim-challenge-page-num">
                {challengeIdx + 1} / {challenges.length}
              </span>
              <button
                type="button"
                className="sim-challenge-nav-btn"
                disabled={challengeIdx === challenges.length - 1}
                onClick={nextChallenge}
                title="Next challenge"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          <button
            type="button"
            className="sim-challenge-minimize-btn"
            onClick={() => setExpanded(false)}
            title="Minimize challenge"
          >
            <span>Minimize</span>
            <ChevronUp size={15} />
          </button>
        </div>
      </div>

      <div className="sim-challenge-body">
        <p className="sim-challenge-question">
          <MathText text={current.question} />
        </p>

        <div className="sim-challenge-options-grid">
          {current.options.map((opt) => {
            const isSelected = selectedOptId === opt.id;
            let statusClass = '';
            if (isSelected) {
              statusClass = opt.isCorrect ? ' selected-correct' : ' selected-incorrect';
            }

            return (
              <button
                key={opt.id}
                type="button"
                className={`sim-challenge-option${statusClass}`}
                onClick={() => handleSelect(opt.id)}
              >
                <span className="sim-challenge-option-letter">{opt.id}</span>
                <span className="sim-challenge-option-text">
                  <MathText text={opt.label} />
                </span>
              </button>
            );
          })}
        </div>

        {selectedOpt && (
          <div
            className={`sim-challenge-feedback ${
              selectedOpt.isCorrect ? 'is-correct' : 'is-review'
            }`}
          >
            <div className="sim-challenge-feedback-head">
              {selectedOpt.isCorrect ? (
                <>
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span className="feedback-status-text correct">Correct Prediction!</span>
                </>
              ) : (
                <>
                  <AlertCircle size={18} className="text-amber-600" />
                  <span className="feedback-status-text review">Concept Insight:</span>
                </>
              )}
            </div>

            <p className="sim-challenge-explanation">
              <MathText text={selectedOpt.explanation} />
            </p>

            <div className="sim-challenge-action-row">
              <div className="sim-challenge-observe-hint">
                <Sparkles size={15} />
                <span>
                  <strong>Observe:</strong> <MathText text={current.observePrompt} />
                </span>
              </div>

              <button
                type="button"
                className="btn-apply-challenge-test"
                onClick={handleApply}
              >
                <Play size={15} />
                <span>{appliedNotice ? '✓ Setup Applied & Testing!' : 'Apply Setup & Test in Sim'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
