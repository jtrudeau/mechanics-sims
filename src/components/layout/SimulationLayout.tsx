import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Zap,
  BookOpen,
  ClipboardList,
  Share2,
  Check,
} from 'lucide-react';
import { MathText } from '../MathText';
import { getSimulation } from '../../content/simulations';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useLayout } from './LayoutContext';
import { TopicGuideView } from './TopicGuideView';
import { TopicProblemsView } from './TopicProblemsView';
import { serializeSimParams } from '../../hooks/useUrlSync';

interface SimulationLayoutProps {
  title: string;
  description: string;
  slug?: string;
  canvasContent: ReactNode;
  theoryContent: ReactNode;
  controlsContent: ReactNode;
  metricsContent: ReactNode;
  actionsContent?: ReactNode;
  challengeContent?: ReactNode;
  shareParams?: Record<string, unknown>;
  onShare?: () => void;
  running?: boolean;
}

export function SimulationLayout({
  title,
  description,
  slug,
  canvasContent,
  theoryContent,
  controlsContent,
  metricsContent,
  actionsContent,
  challengeContent,
  shareParams,
  onShare,
}: SimulationLayoutProps) {
  const entry = slug ? getSimulation(slug) : undefined;
  const [theoryOpen, setTheoryOpen] = useState(false);
  const { wideCanvas, setWideCanvas, setSidebarCollapsed } = useLayout();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shareCopied, setShareCopied] = useState(false);

  // Active topic layer tab: 'sim' | 'guide' | 'practice'
  const activeTab = (searchParams.get('tab') || 'sim') as 'sim' | 'guide' | 'practice';

  usePageTitle(entry ? `${entry.shortTitle} · SN1 Mechanics` : `${title} · SN1 Mechanics`);

  // Keyboard shortcut: Press 'W' to toggle Projector Mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        toggleWide();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setWideCanvas, setSidebarCollapsed]);

  const toggleWide = () => {
    setWideCanvas((w) => {
      const next = !w;
      if (next) setSidebarCollapsed(true);
      return next;
    });
  };

  const setTab = (tab: 'sim' | 'guide' | 'practice') => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'sim') {
      next.delete('tab');
    } else {
      next.set('tab', tab);
    }
    setSearchParams(next, { replace: true });
  };

  const handleLoadSetup = (params?: Record<string, string | number | boolean>) => {
    const next = new URLSearchParams(searchParams);
    next.delete('tab'); // switch back to simulation
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) {
          next.set(k, String(v));
        }
      }
    }
    setSearchParams(next, { replace: true });
  };

  const handleShareClick = async () => {
    if (onShare) {
      onShare();
      return;
    }
    if (shareParams) {
      try {
        const qs = serializeSimParams(shareParams);
        const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
        window.history.replaceState(null, '', newUrl);
        await navigator.clipboard.writeText(window.location.href);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      } catch {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      }
    }
  };

  return (
    <div className="sim-workspace">
      {/* ── 3-Layer Tabbed Hub Navigation ── */}
      {entry && (
        <div className="sim-tab-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sim'}
            className={`sim-tab-btn${activeTab === 'sim' ? ' active' : ''}`}
            onClick={() => setTab('sim')}
          >
            <Zap size={15} />
            <span>Simulation</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'guide'}
            className={`sim-tab-btn${activeTab === 'guide' ? ' active' : ''}`}
            onClick={() => setTab('guide')}
          >
            <BookOpen size={15} />
            <span>Tips &amp; Revision</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'practice'}
            className={`sim-tab-btn${activeTab === 'practice' ? ' active' : ''}`}
            onClick={() => setTab('practice')}
          >
            <ClipboardList size={15} />
            <span>Practice &amp; Homework</span>
          </button>
        </div>
      )}

      {/* ── Tab 1: Live Interactive Simulation Stage ── */}
      <div
        className={`sim-layout${wideCanvas ? ' is-wide' : ''}`}
        style={{ display: activeTab === 'sim' ? 'grid' : 'none' }}
      >
        <div className="sim-canvas-col">
          <div className="sim-header">
            <div className="sim-header-copy">
              <h1>{title}</h1>
              <p className="text-muted textbook-font">{description}</p>
            </div>
            <div className="sim-header-actions">
              {actionsContent}
              {(shareParams || onShare) && (
                <button
                  type="button"
                  className={`btn-share-toggle ${shareCopied ? 'active' : 'secondary'}`}
                  onClick={handleShareClick}
                  title="Copy a shareable link with this exact simulation setup"
                >
                  {shareCopied ? <Check size={16} /> : <Share2 size={16} />}
                  <span>{shareCopied ? 'Link Copied!' : 'Share Setup'}</span>
                </button>
              )}
              <button
                type="button"
                className={`btn-projector-toggle ${wideCanvas ? 'active' : 'secondary'}`}
                onClick={toggleWide}
                title={wideCanvas ? 'Exit Projector Mode (Press W)' : 'Projector Mode: Expand canvas for classroom display (Press W)'}
              >
                {wideCanvas ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                <span>{wideCanvas ? 'Exit Projector' : 'Projector Mode'}</span>
              </button>
            </div>
          </div>
          {challengeContent && (
            <div className="sim-challenge-wrapper">{challengeContent}</div>
          )}
          <div className="glass-panel sim-canvas-panel">{canvasContent}</div>
        </div>

        {wideCanvas && (
          <button
            type="button"
            className="sim-companion-tab"
            onClick={() => setWideCanvas(false)}
            title="Show parameters and live dynamics"
          >
            <SlidersHorizontal size={16} />
            Panels
          </button>
        )}

        <div className="sim-companion">
          {entry?.guide.tryThis && (
            <div className="glass-panel sim-try-this">
              <h2 className="sim-section-heading">Suggested exercise</h2>
              <p className="textbook-font" style={{ margin: 0 }}>
                <MathText text={entry.guide.tryThis} />
              </p>
            </div>
          )}

          <div className="glass-panel">
            <h2 className="sim-section-heading">Parameters</h2>
            {controlsContent}
          </div>

          <div className="glass-panel">
            <h2 className="sim-section-heading">Live Dynamics</h2>
            {metricsContent}
          </div>

          <div className={`glass-panel sim-theory-panel textbook-font${theoryOpen ? '' : ' collapsed'}`}>
            <button
              type="button"
              className="theory-toggle"
              onClick={() => setTheoryOpen((o) => !o)}
              aria-expanded={theoryOpen}
            >
              {theoryOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="sim-section-heading" style={{ margin: 0 }}>
                {theoryOpen ? 'Theory' : 'Theory (expand after attempting the exercise)'}
              </span>
            </button>
            {theoryOpen && <div className="theory-body">{theoryContent}</div>}
          </div>
        </div>
      </div>

      {/* ── Tab 2: Tips & Revision (Learning Goals, Pitfalls, Figure Notes) ── */}
      {entry && activeTab === 'guide' && (
        <div className="sim-tab-content">
          <TopicGuideView sim={entry} onLoadSetup={handleLoadSetup} />
        </div>
      )}

      {/* ── Tab 3: Practice Problems & Multi-Step Homework with Figures ── */}
      {slug && activeTab === 'practice' && (
        <div className="sim-tab-content">
          <TopicProblemsView slug={slug} onLoadSetup={handleLoadSetup} />
        </div>
      )}
    </div>
  );
}
