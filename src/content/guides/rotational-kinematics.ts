import type { SimGuideContent } from '../types';

export const rotationalKinematicsGuide: SimGuideContent = {
  learningGoals: [
    'Use the rotational analogues: $\\theta \\leftrightarrow x$, $\\omega \\leftrightarrow v$, $\\alpha \\leftrightarrow a$.',
    'Read slope of $\\theta$–$t$ as $\\omega$ and slope of $\\omega$–$t$ as $\\alpha$.',
    'Read signed area under $\\omega$–$t$ as $\\Delta\\theta$ and under $\\alpha$–$t$ as $\\Delta\\omega$.',
    'Connect a spinning disk’s kinematics graphs to $v_t = \\omega R$ at the rim.',
    'Classify a rim point as UCM ($\\alpha = 0$, $a_t = 0$) or non-UCM (both $a_r$ and $a_t$).',
    'Compute $a_r = \\omega^2 R$ and $a_t = \\alpha R$ from the same $\\omega(t)$ and $\\alpha(t)$ shown on the graphs.',
  ],
  howToUse: [
    'Pick a profile: constant $\\omega$, constant $\\alpha$, or spin-up then coast.',
    'Play and watch $\\theta$, $\\omega$, and $\\alpha$ graphs share one cursor with the disk.',
    'Measure slope on $\\theta$–$t$ and compare with $\\omega_\\mathrm{avg}$ in Live Dynamics.',
    'Shade $\\omega$–$t$ and check that the area equals $\\Delta\\theta$ (radians).',
    'Change $R$ and confirm that graphs of $\\theta,\\omega,\\alpha$ are unchanged while $v_t$ scales.',
    'On Constant $\\omega$, confirm $a_t = 0$ (UCM). On Constant $\\alpha$, read both $a_r$ and $a_t$ at the rim.',
  ],
  watchFors: [
    'Mixing degrees and radians — the graphs and $\\tau = I\\alpha$ use radians.',
    'Thinking a horizontal $\\omega$–$t$ graph means the disk has stopped; it means constant spin rate.',
    'Confusing $\\alpha$ (how fast $\\omega$ changes) with $\\omega$ (how fast $\\theta$ changes).',
    'Forgetting that $\\Delta\\theta$ from area can exceed $2\\pi$ (multiple revolutions).',
    'Calling constant $\\omega$ “no acceleration”: a rim point still has $a_r$ toward the axis.',
    'Mixing $a_t = \\alpha R$ (changes speed) with $a_r = \\omega^2 R$ (changes direction).',
  ],
  canvasTips: [
    'The disk mark tracks $\\theta$. Graphs use the unwrapped angle (not wrapped to $[0, 2\\pi)$).',
    'Blue secant = average $\\omega$ or $\\alpha$ on $[t_A, t_B]$.',
    'Green shading on $\\omega$–$t$ is $\\Delta\\theta$; purple on $\\alpha$–$t$ is $\\Delta\\omega$.',
    'Rim speed $v_t = \\omega R$ is in Live Dynamics; with rim vectors on, green $= \\vec{v}$, ochre $= \\vec{a}_r$, vermillion $= \\vec{a}_t$.',
    'The UCM / non-UCM chip follows $\\alpha$ at the cursor, including after coast begins.',
  ],
  tryThis:
    'On Constant $\\alpha$, freeze at a time when $\\omega \\neq 0$. Compare $a_r$ and $a_t$. Then switch to Constant $\\omega$ with the same $\\omega$ and $R$: which vector disappears, and why?',
  revisionProblems: [
    {
      id: 'rk-1',
      prompt:
        'Constant $\\alpha = 1.5\\,\\mathrm{rad/s}^2$, $\\omega_0 = 0$. Find $\\omega$ and $\\theta$ at $t = 4\\,\\mathrm{s}$.',
      hint: '$\\omega = \\omega_0 + \\alpha t$ and $\\theta = \\omega_0 t + \\tfrac{1}{2}\\alpha t^2$ (radians).',
      checkWithSim: [
        'Choose Constant $\\alpha$, set $\\alpha = 1.5$, $\\omega_0 = 0$.',
        'Cursor at $t = 4\\,\\mathrm{s}$; read Live Dynamics.',
      ],
      answer: '$\\omega(4) = 6\\,\\mathrm{rad/s}$. $\\theta(4) = \\tfrac{1}{2}(1.5)(16) = 12\\,\\mathrm{rad}$.',
      simParams: { profile: 'const-alpha', alpha: 1.5, w0: 0, tMax: 8, tCursor: 4 },
    },
    {
      id: 'rk-2',
      prompt:
        'Same motion. Area under $\\omega$–$t$ from $0$ to $4\\,\\mathrm{s}$ should equal $\\Delta\\theta$. Compute the triangle.',
      hint: '$\\omega$ goes from $0$ to $6\\,\\mathrm{rad/s}$ in $4\\,\\mathrm{s}$.',
      checkWithSim: [
        'Set $t_A = 0$, $t_B = 4$ and enable $\\omega$–$t$ area.',
        'Compare with $\\theta(4) - \\theta(0)$.',
      ],
      answer: '$\\tfrac{1}{2}(4)(6) = 12\\,\\mathrm{rad} = \\Delta\\theta$.',
      simParams: { profile: 'const-alpha', alpha: 1.5, w0: 0, tA: 0, tB: 4, tCursor: 4 },
    },
    {
      id: 'rk-3',
      prompt:
        'Spin-up then coast. After $\\alpha$ drops to zero, what happens to $\\theta$–$t$ and to $\\omega$–$t$?',
      hint: 'Coast means constant $\\omega$, so $\\theta$ grows linearly.',
      checkWithSim: [
        'Choose Spin-up then coast.',
        'Watch the $\\alpha$–$t$ step down, then inspect the other two graphs.',
      ],
      answer:
        '$\\omega$–$t$ becomes horizontal (constant spin). $\\theta$–$t$ becomes a straight line with that slope. $\\alpha = 0$. The disk does not stop.',
      simParams: { profile: 'spin-coast', tCursor: 5 },
    },
    {
      id: 'rk-4',
      prompt:
        'A disk of radius $R = 0.40\\,\\mathrm{m}$ has $\\omega = 5.0\\,\\mathrm{rad/s}$. What is the rim speed $v_t$? If $R$ doubles at the same $\\omega$, what happens to $v_t$?',
      hint: '$v_t = \\omega R$. Angular graphs do not depend on $R$.',
      checkWithSim: [
        'Choose Constant $\\omega$, set $\\omega_0 = 5$, $R = 0.4$.',
        'Read $v_t$, then double $R$.',
      ],
      answer: '$v_t = 5.0 \\times 0.40 = 2.0\\,\\mathrm{m/s}$. Doubling $R$ doubles $v_t$ to $4.0\\,\\mathrm{m/s}$; $\\omega$ is unchanged.',
      simParams: { profile: 'const-omega', w0: 5, R: 0.4, tCursor: 2 },
    },
    {
      id: 'rk-5',
      prompt:
        'Constant $\\omega = 4.0\\,\\mathrm{rad/s}$, $R = 0.50\\,\\mathrm{m}$. Is a rim point in UCM or non-UCM? Find $a_r$ and $a_t$.',
      hint: 'UCM means constant speed on a circle: $\\alpha = 0$ so $a_t = 0$, but $a_r = \\omega^2 R$ is not zero.',
      checkWithSim: [
        'Choose Constant $\\omega$ (UCM at the rim), set $\\omega_0 = 4$, $R = 0.5$.',
        'Turn on rim vectors. Read $a_r$ and $a_t$ in Live Dynamics.',
      ],
      answer:
        'UCM. $a_t = 0$. $a_r = (4)^2(0.50) = 8.0\\,\\mathrm{m/s}^2$ toward the axis. Speed is constant; velocity still changes direction.',
      simParams: { profile: 'const-omega', w0: 4, R: 0.5, tCursor: 1 },
    },
    {
      id: 'rk-6',
      prompt:
        'Same $R = 0.50\\,\\mathrm{m}$, now constant $\\alpha = 2.0\\,\\mathrm{rad/s}^2$ from rest. At $t = 2.0\\,\\mathrm{s}$, find $\\omega$, $a_t$, $a_r$, and $|\\vec{a}|$ at the rim.',
      hint: '$\\omega = \\alpha t$, $a_t = \\alpha R$, $a_r = \\omega^2 R$, $|a| = \\sqrt{a_r^2+a_t^2}$.',
      checkWithSim: [
        'Choose Constant $\\alpha$, $\\alpha = 2$, $\\omega_0 = 0$, $R = 0.5$, cursor at $t = 2$.',
        'Compare Live Dynamics with the chip “non-UCM”.',
      ],
      answer:
        '$\\omega = 4.0\\,\\mathrm{rad/s}$, $a_t = 1.0\\,\\mathrm{m/s}^2$, $a_r = 8.0\\,\\mathrm{m/s}^2$, $|a| = \\sqrt{65} \\approx 8.06\\,\\mathrm{m/s}^2$. Non-UCM: both components.',
      simParams: { profile: 'const-alpha', alpha: 2, w0: 0, R: 0.5, tCursor: 2 },
    },
  ],
};
