import type { ReactNode } from 'react';
import { InlineMath } from 'react-katex';

const INK = '#0f172a';
const MUTED = '#334155';
const ACCENT = '#1d4ed8';
const GROUND = '#57534e';

function ArrowMarker({ id, color = INK }: { id: string; color?: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="7"
      markerHeight="7"
      orient="auto-start-reverse"
    >
      <path d="M 0 1.2 L 9 5 L 0 8.8 Z" fill={color} />
    </marker>
  );
}

function FigMath({
  x,
  y,
  math,
  color,
  anchor = 'start',
  w = 110,
  h = 30,
}: {
  x: number;
  y: number;
  math: string;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  w?: number;
  h?: number;
}) {
  const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return (
    <foreignObject x={left} y={y - h * 0.78} width={w} height={h} overflow="visible">
      <div className={`fig-katex fig-katex-${anchor}`} style={{ color: color ?? INK }}>
        <InlineMath math={math} />
      </div>
    </foreignObject>
  );
}

function Frame({
  viewBox,
  children,
}: {
  viewBox: string;
  children: ReactNode;
}) {
  return (
    <svg
      className="problem-figure-svg"
      viewBox={viewBox}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <ArrowMarker id="ah-ink" />
        <ArrowMarker id="ah-blue" color={ACCENT} />
      </defs>
      {children}
    </svg>
  );
}

function TwoStageMotion() {
  return (
    <Frame viewBox="0 0 420 150">
      <line x1="30" y1="88" x2="390" y2="88" stroke={INK} strokeWidth="1.4" markerEnd="url(#ah-ink)" />
      <FigMath x={400} y={92} math="x" w={28} h={24} />
      {[30, 130, 270, 370].map((x) => (
        <line key={x} x1={x} y1="82" x2={x} y2="94" stroke={INK} strokeWidth="1.4" />
      ))}
      <rect x="36" y="54" width="18" height="12" rx="2" fill="#e2e8f0" stroke={INK} strokeWidth="1.2" />
      <circle cx="40" cy="70" r="4" fill={INK} />
      <circle cx="50" cy="70" r="4" fill={INK} />
      <FigMath x={80} y={40} math="a=+2.0\,\mathrm{m/s}^2" w={150} />
      <FigMath x={188} y={40} math="v=\mathrm{const}" w={110} />
      <FigMath x={292} y={40} math="a=-3.0\,\mathrm{m/s}^2" w={150} />
      <path d="M 40 78 L 40 50" stroke={ACCENT} strokeWidth="1.1" fill="none" />
      <text x="80" y="112" className="fig-label">0</text>
      <text x="130" y="112" className="fig-label">4.0 s</text>
      <text x="270" y="112" className="fig-label">10.0 s</text>
      <text x="368" y="112" className="fig-label">stop</text>
      <text x="210" y="138" className="fig-caption">from rest · three successive stages</text>
    </Frame>
  );
}

function HillCrest() {
  return (
    <Frame viewBox="0 0 360 200">
      <path
        d="M 20 170 Q 80 170 120 110 Q 180 20 240 110 Q 280 170 340 170"
        fill="none"
        stroke={GROUND}
        strokeWidth="2.2"
      />
      <path d="M 20 170 L 340 170" stroke="#d6d3d1" strokeWidth="1" strokeDasharray="4 4" />
      <circle cx="180" cy="48" r="11" fill="#cbd5e1" stroke={INK} strokeWidth="1.4" />
      <line x1="180" y1="48" x2="180" y2="118" stroke={MUTED} strokeWidth="1" strokeDasharray="3 3" />
      <FigMath x={196} y={92} math="R" w={28} />
      <path d="M 180 48 L 210 48" stroke={ACCENT} strokeWidth="1.6" markerEnd="url(#ah-blue)" />
      <FigMath x={218} y={42} math="\vec{v}" color={ACCENT} w={36} />
      <text x="188" y="36" className="fig-label">crest</text>
      <text x="180" y="188" className="fig-caption">circular crest · particle at the top</text>
    </Frame>
  );
}

function FlywheelRim() {
  return (
    <Frame viewBox="0 0 280 240">
      <circle cx="130" cy="120" r="72" fill="#e0f2fe" stroke={INK} strokeWidth="1.8" />
      <circle cx="130" cy="120" r="3.5" fill={INK} />
      <line x1="130" y1="120" x2="202" y2="120" stroke={INK} strokeWidth="1.3" />
      <circle cx="202" cy="120" r="5" fill="#b91c1c" stroke={INK} strokeWidth="0.8" />
      <FigMath x={158} y={110} math="R" w={28} />
      <text x="212" y="116" className="fig-label">P</text>
      <line x1="202" y1="120" x2="202" y2="58" stroke="#047857" strokeWidth="1.8" markerEnd="url(#ah-ink)" />
      <FigMath x={210} y={70} math="\vec{v}" color="#047857" w={36} />
      <line x1="202" y1="120" x2="150" y2="120" stroke="#9a3412" strokeWidth="1.8" markerEnd="url(#ah-ink)" />
      <FigMath x={148} y={142} math="\vec{a}_r" color="#9a3412" w={44} />
      <line x1="202" y1="120" x2="202" y2="168" stroke="#9f1239" strokeWidth="1.8" markerEnd="url(#ah-ink)" />
      <FigMath x={210} y={164} math="\vec{a}_t" color="#9f1239" w={44} />
      <text x="130" y="220" className="fig-caption">fixed axis · point P on the rim</text>
    </Frame>
  );
}

function CartHanger() {
  return (
    <Frame viewBox="0 0 380 200">
      <line x1="24" y1="86" x2="250" y2="86" stroke={GROUND} strokeWidth="2.4" />
      <rect x="70" y="58" width="70" height="28" fill="#e2e8f0" stroke={INK} strokeWidth="1.3" />
      <FigMath x={105} y={76} math="m_c" anchor="middle" w={44} />
      <line x1="140" y1="72" x2="268" y2="72" stroke={INK} strokeWidth="1.2" />
      <circle cx="268" cy="72" r="10" fill="none" stroke={INK} strokeWidth="1.5" />
      <circle cx="268" cy="72" r="2" fill={INK} />
      <line x1="278" y1="72" x2="278" y2="128" stroke={INK} strokeWidth="1.2" />
      <rect x="266" y="128" width="24" height="28" fill="#fee2e2" stroke={INK} strokeWidth="1.3" />
      <FigMath x={318} y={148} math="m_h" w={44} />
      <FigMath x={105} y={118} math="\mu_k" anchor="middle" w={44} />
      <text x="190" y="178" className="fig-caption">horizontal track · light string · pulley</text>
    </Frame>
  );
}

function TwoBlocks() {
  return (
    <Frame viewBox="0 0 360 150">
      <line x1="20" y1="100" x2="340" y2="100" stroke={GROUND} strokeWidth="2.2" />
      <rect x="90" y="58" width="70" height="42" fill="#dbeafe" stroke={INK} strokeWidth="1.3" />
      <rect x="160" y="50" width="86" height="50" fill="#fee2e2" stroke={INK} strokeWidth="1.3" />
      <FigMath x={125} y={84} math="m_1" anchor="middle" w={44} />
      <FigMath x={203} y={80} math="m_2" anchor="middle" w={44} />
      <line x1="44" y1="78" x2="88" y2="78" stroke={ACCENT} strokeWidth="1.8" markerEnd="url(#ah-blue)" />
      <FigMath x={52} y={64} math="F" color={ACCENT} w={28} />
      <text x="180" y="132" className="fig-caption">frictionless floor · contact between the blocks</text>
    </Frame>
  );
}

function InclineBlock() {
  return (
    <Frame viewBox="0 0 340 200">
      <polygon points="36,168 280,168 280,52" fill="#f5f5f4" stroke={INK} strokeWidth="1.6" />
      <g transform="rotate(-27 150 120)">
        <rect x="118" y="86" width="56" height="28" fill="#e2e8f0" stroke={INK} strokeWidth="1.3" />
        <FigMath x={146} y={105} math="m" anchor="middle" w={28} />
      </g>
      <path d="M 280 168 A 36 36 0 0 1 258 140" fill="none" stroke={MUTED} strokeWidth="1.1" />
      <FigMath x={248} y={162} math="\theta" w={28} />
      <FigMath x={170} y={190} math="\mu_s,\;\mu_k" anchor="middle" w={90} />
    </Frame>
  );
}

function ForceTable3() {
  return (
    <Frame viewBox="0 0 280 260">
      <circle cx="140" cy="130" r="78" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
      <line x1="50" y1="130" x2="230" y2="130" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="140" y1="40" x2="140" y2="220" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="140" y1="130" x2="218" y2="130" stroke="#1d4ed8" strokeWidth="2" markerEnd="url(#ah-ink)" />
      <line x1="140" y1="130" x2="140" y2="58" stroke="#0f766e" strokeWidth="2" markerEnd="url(#ah-ink)" />
      <line x1="140" y1="130" x2="78" y2="176" stroke="#b91c1c" strokeWidth="2" markerEnd="url(#ah-ink)" />
      <circle cx="140" cy="130" r="4" fill={INK} />
      <FigMath x={228} y={124} math="\vec{F}_1" color="#1d4ed8" w={44} />
      <FigMath x={150} y={50} math="\vec{F}_2" color="#0f766e" w={44} />
      <FigMath x={40} y={192} math="\vec{F}_3" color="#b91c1c" w={44} />
      <FigMath x={140} y={246} math="\text{ring at }O:\ \vec{F}_3\text{ so }\sum\vec{F}=0" anchor="middle" w={240} />
    </Frame>
  );
}

function LoopTheLoop() {
  return (
    <Frame viewBox="0 0 340 230">
      <path
        d="M 36 40 L 36 170 Q 36 200 70 200 L 130 200"
        fill="none"
        stroke={INK}
        strokeWidth="2"
      />
      <circle cx="210" cy="130" r="54" fill="none" stroke={INK} strokeWidth="2" />
      <path d="M 264 130 L 310 130" fill="none" stroke={INK} strokeWidth="2" />
      <circle cx="36" cy="48" r="7" fill="#334155" />
      <line x1="48" y1="40" x2="48" y2="200" stroke={MUTED} strokeWidth="1" strokeDasharray="3 3" />
      <FigMath x={56} y={120} math="H" w={28} />
      <line x1="210" y1="130" x2="210" y2="76" stroke={MUTED} strokeWidth="1" />
      <FigMath x={218} y={108} math="R" w={28} />
      <text x="210" y="38" className="fig-label">top</text>
      <text x="170" y="218" className="fig-caption">frictionless track into a vertical loop</text>
    </Frame>
  );
}

function DiskUnwinding() {
  return (
    <Frame viewBox="0 0 300 230">
      <circle cx="150" cy="88" r="48" fill="#e0f2fe" stroke={INK} strokeWidth="1.8" />
      <circle cx="150" cy="88" r="3" fill={INK} />
      <line x1="150" y1="40" x2="150" y2="136" stroke={INK} strokeWidth="1" strokeDasharray="3 3" />
      <FigMath x={162} y={64} math="R" w={28} />
      <FigMath x={198} y={84} math="M,\;I" w={70} />
      <line x1="198" y1="88" x2="198" y2="150" stroke={INK} strokeWidth="1.2" />
      <rect x="186" y="150" width="24" height="26" fill="#fee2e2" stroke={INK} strokeWidth="1.3" />
      <FigMath x={230} y={168} math="m" w={28} />
      <text x="150" y="210" className="fig-caption">solid disk · string wrapped · hanging mass</text>
    </Frame>
  );
}

function XtParticle() {
  return (
    <Frame viewBox="0 0 360 180">
      <line x1="40" y1="150" x2="330" y2="150" stroke={INK} strokeWidth="1.3" markerEnd="url(#ah-ink)" />
      <line x1="40" y1="150" x2="40" y2="24" stroke={INK} strokeWidth="1.3" markerEnd="url(#ah-ink)" />
      <FigMath x={338} y={154} math="t" w={24} />
      <FigMath x={18} y={22} math="x" w={24} />
      <path d="M 40 150 Q 110 20 180 70 T 300 150" fill="none" stroke={ACCENT} strokeWidth="2" />
      <circle cx="180" cy="70" r="4" fill={ACCENT} />
      <FigMath x={196} y={60} math="t=2\,\mathrm{s}" w={80} />
      <FigMath x={180} y={24} math="x(t)=4t-t^2\ \text{(SI)}" anchor="middle" w={180} />
    </Frame>
  );
}

const FIGURES = {
  'two-stage-motion': TwoStageMotion,
  'hill-crest': HillCrest,
  'flywheel-rim': FlywheelRim,
  'cart-hanger-friction': CartHanger,
  'two-blocks': TwoBlocks,
  'incline-block': InclineBlock,
  'force-table-3': ForceTable3,
  'loop-the-loop': LoopTheLoop,
  'disk-unwinding': DiskUnwinding,
  'x-t-particle': XtParticle,
} as const;

export type ProblemFigureId = keyof typeof FIGURES;

export function ProblemFigure({ id }: { id: ProblemFigureId }) {
  const Fig = FIGURES[id];
  return (
    <div className="problem-figure">
      <Fig />
    </div>
  );
}
