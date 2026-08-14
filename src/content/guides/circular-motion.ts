import type { SimGuideContent } from '../types';

export const circularMotionGuide: SimGuideContent = {
  learningGoals: [
    'Identify radial (centripetal) acceleration as always toward the center.',
    'Distinguish tangential acceleration (changing speed) from radial acceleration (changing direction).',
    'Relate $a_r = v^2/R$ and $a_t = \\alpha R$ to the vector diagram.',
    'Explain when motion is uniform circular vs non-uniform circular.',
  ],
  howToUse: [
    'Start with $\\alpha = 0$ (uniform circular motion) and watch only $a_r$ and $v$.',
    'Turn on nonzero angular acceleration and observe $a_t$ appear tangent to the path.',
    'Use Freeze to inspect the vector parallelogram without the trail racing ahead.',
    'Change $R$ or $\\omega$ and predict how $a_r$ scales before checking the metrics.',
    'Watch the parallelogram that builds $\\vec{a}$ from $a_r$ and $a_t$.',
  ],
  watchFors: [
    'Thinking centripetal acceleration exists only when speed is changing.',
    'Drawing $a_r$ opposite the velocity instead of toward the center.',
    'Confusing “centrifugal force” with the inward $a_r$ required by kinematics.',
    'Assuming $a_t$ is needed whenever an object moves in a circle.',
  ],
  canvasTips: [
    'Green = velocity (tangent); ochre = radial accel; vermillion = tangential accel.',
    'When $\\alpha = 0$, only $a_r$ should appear (plus $v$).',
    'The tip-to-tail construction shows $\\vec{a} = \\vec{a}_r + \\vec{a}_t$ geometrically.',
    'Live metrics report magnitudes; directions live on the canvas arrows.',
  ],
  tryThis:
    'With $\\alpha = 0$, double the speed at fixed $R$. By what factor does $a_r$ change?',
  revisionProblems: [
    {
      id: 'cm-1',
      prompt:
        'For uniform circular motion with $R = 2\\,\\mathrm{m}$ and $v = 4\\,\\mathrm{m/s}$, what is $a_r$? What is $a_t$?',
      hint: '$a_r = v^2/R$; uniform means $\\alpha = 0$ so $a_t = 0$.',
      checkWithSim: [
        'Set $\\alpha = 0$ and adjust $R$ and speed (or $\\omega$) to match $v = 4\\,\\mathrm{m/s}$, $R = 2\\,\\mathrm{m}$.',
        'Read $a_r$ and $a_t$ in Live Dynamics.',
      ],
      answer:
        '$a_r = 16/2 = 8\\,\\mathrm{m/s}^2$ toward the center. $a_t = 0$ because speed is constant.',
      // v = ω R ⇒ ω = 4/2 = 2 rad/s
      simParams: { R: 2, w0: 2, alpha: 0 },
    },
    {
      id: 'cm-2',
      prompt:
        'Same $R$ and $v$ as above, but now the object is speeding up with $a_t = 3\\,\\mathrm{m/s}^2$. What is the magnitude of total acceleration?',
      hint: '$a_r \\perp a_t$, so $|a| = \\sqrt{a_r^2 + a_t^2}$.',
      checkWithSim: [
        'Enable tangential acceleration and set $a_t \\approx 3\\,\\mathrm{m/s}^2$.',
        'Compare the vector sum on canvas with $\\sqrt{8^2 + 3^2}$.',
      ],
      answer:
        '$|a| = \\sqrt{64 + 9} = \\sqrt{73} \\approx 8.54\\,\\mathrm{m/s}^2$. Direction is between inward radial and tangential, not along either alone.',
      // a_t = α R ⇒ α = 3/2 = 1.5; freeze-friendly start at same ω
      simParams: { R: 2, w0: 2, alpha: 1.5 },
    },
    {
      id: 'cm-3',
      prompt:
        'If radius doubles while $\\omega$ stays fixed, how do $v$ and $a_r$ change?',
      hint: '$v = \\omega R$ and $a_r = \\omega^2 R$.',
      checkWithSim: [
        'Hold angular speed fixed if the controls allow, double $R$, and compare metrics.',
      ],
      answer:
        '$v$ doubles ($\\propto R$). $a_r$ doubles ($\\propto R$) at fixed $\\omega$. If instead you held $v$ fixed and doubled $R$, $a_r$ would halve.',
      simParams: { R: 2, w0: 1.5, alpha: 0 },
    },
    {
      id: 'cm-4',
      prompt:
        'A peer says “no acceleration in uniform circular motion because speed is constant.” Rewrite the claim correctly.',
      hint: 'Acceleration can change direction without changing speed.',
      checkWithSim: [
        'Run with $\\alpha = 0$ and watch the velocity arrow continuously turn while $|v|$ stays constant.',
      ],
      answer:
        'Speed is constant, but velocity’s direction changes, so there is nonzero centripetal acceleration $a_r = v^2/R$ toward the center. “No tangential acceleration” is the accurate statement.',
      simParams: { R: 5, w0: 1, alpha: 0 },
    },
  ],
};
