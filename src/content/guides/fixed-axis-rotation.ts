import type { SimGuideContent } from '../types';

export const fixedAxisRotationGuide: SimGuideContent = {
  learningGoals: [
    'Compute torque from force, lever arm, and angle: $\\tau = r F \\sin\\phi$.',
    'Relate net torque to angular acceleration via $\\tau_\\mathrm{net} = I\\alpha$.',
    'Compare how mass distribution ($I$ presets) changes $\\alpha$ for the same torque.',
    'Connect rotational KE and rim speed to the translation analogy.',
  ],
  howToUse: [
    'Pick a body preset (disk, hoop, rod) and note $I$.',
    'Apply a force at a chosen radius and angle; read $\\tau$ and $\\alpha$.',
    'Enable Compare disk vs hoop to see both $I$ and $\\alpha$ at the same $M$, $R$, $F$, $r$, $\\phi$.',
    'Play and watch $\\omega$ and $\\theta$ grow; try a brake torque to reverse $\\alpha$.',
    'Toggle torque decomposition / rim speed displays to see $F_t$ and $v_t = \\omega R$.',
  ],
  watchFors: [
    'Thinking a large force always means a large torque (angle and $r$ matter).',
    'Confusing mass $M$ with moment of inertia $I$.',
    'Assuming hoop and disk with same $M$ and $R$ have the same $\\alpha$.',
    'Mixing up tangential force component with the full force vector.',
  ],
  canvasTips: [
    'Only the tangential component of $F$ contributes to $\\tau$.',
    'Curved arrows show the sense of $\\omega$ or $\\tau$.',
    'Larger $I$ (mass farther from axis) yields smaller $\\alpha$ for the same $\\tau$.',
    'Compare mode overlays $\\alpha_\\mathrm{disk}$ and $\\alpha_\\mathrm{hoop}$ with a ghost rim outline.',
  ],
  tryThis:
    'For equal $M$, $R$, and applied force, compare $\\alpha$ for a solid disk and a hoop (Compare disk vs hoop).',
  revisionProblems: [
    {
      id: 'far-1',
      prompt:
        'A force $F = 10\\,\\mathrm{N}$ acts at $r = 0.5\\,\\mathrm{m}$ with $\\phi = 90^\\circ$ on a body with $I = 2\\,\\mathrm{kg\\cdot m^{2}}$. Find $\\tau$ and $\\alpha$.',
      hint: '$\\tau = r F \\sin\\phi$; $\\alpha = \\tau / I$.',
      checkWithSim: [
        'Set force, radius, and angle for maximum torque.',
        'Choose or adjust parameters so $I \\approx 2$ and read $\\tau$, $\\alpha$.',
      ],
      answer:
        '$\\tau = 0.5 \\times 10 \\times 1 = 5\\,\\mathrm{N\\cdot m}$. $\\alpha = 5/2 = 2.5\\,\\mathrm{rad/s}^2$.',
      simParams: { mass: 4, size: 1, force: 10, forceRadius: 0.5, forceAngleDeg: 90, preset: 'solid-disk' },
    },
    {
      id: 'far-2',
      prompt:
        'Same $F$ and $r$ but $\\phi = 30^\\circ$. How does $\\tau$ change?',
      hint: '$\\sin 30^\\circ = 1/2$.',
      checkWithSim: [
        'Change the force angle to $30^\\circ$ and compare $\\tau$ to the $\\phi = 90^\\circ$ case.',
      ],
      answer:
        '$\\tau = 0.5 \\times 10 \\times 0.5 = 2.5\\,\\mathrm{N\\cdot m}$ — half of the perpendicular case. Direction of $F$ relative to the position vector matters as much as $|F|$.',
      simParams: { mass: 4, size: 1, force: 10, forceRadius: 0.5, forceAngleDeg: 30, preset: 'solid-disk' },
    },
    {
      id: 'far-3',
      prompt:
        'Solid disk vs hoop: both $M = 4\\,\\mathrm{kg}$, $R = 0.5\\,\\mathrm{m}$, same $\\tau$. Which has larger $\\alpha$? By what factor?',
      hint: '$I_\\mathrm{disk} = \\tfrac{1}{2}MR^2$; $I_\\mathrm{hoop} = MR^2$.',
      checkWithSim: [
        'Match $M$ and $R$; enable Compare disk vs hoop.',
        'Compare $\\alpha$ (or $I$) in Live Dynamics.',
      ],
      answer:
        '$I_\\mathrm{hoop} = 2 I_\\mathrm{disk}$, so $\\alpha_\\mathrm{disk} = 2\\alpha_\\mathrm{hoop}$ for the same $\\tau$. Mass farther from the axis resists angular acceleration more.',
      simParams: {
        mass: 4,
        size: 1,
        force: 12,
        forceRadius: 1,
        forceAngleDeg: 90,
        preset: 'solid-disk',
        compareDiskHoop: true,
      },
    },
    {
      id: 'far-4',
      prompt:
        'If $\\omega = 4\\,\\mathrm{rad/s}$ and $R = 1\\,\\mathrm{m}$, what is rim tangential speed? How does $K_\\mathrm{rot}$ scale if $\\omega$ doubles at fixed $I$?',
      hint: '$v_t = \\omega R$; $K_\\mathrm{rot} = \\tfrac{1}{2} I \\omega^2$.',
      checkWithSim: [
        'Run until $\\omega \\approx 4\\,\\mathrm{rad/s}$ and read rim speed if shown.',
        'Compare energy when $\\omega$ has doubled.',
      ],
      answer:
        '$v_t = 4 \\times 1 = 4\\,\\mathrm{m/s}$. Doubling $\\omega$ multiplies $K_\\mathrm{rot}$ by $4$ (quadratic in $\\omega$), analogous to $\\tfrac{1}{2} m v^2$.',
      simParams: { mass: 4, size: 1, force: 0, forceRadius: 1, omega0: 4, preset: 'solid-disk' },
    },
  ],
};
