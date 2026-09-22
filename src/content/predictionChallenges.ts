export interface PredictionOption {
  id: string;
  label: string;
  isCorrect: boolean;
  explanation: string;
}

export interface PredictionChallenge {
  id: string;
  simSlug: string;
  topicTitle: string;
  question: string;
  options: PredictionOption[];
  testSetup: Record<string, unknown>;
  observePrompt: string;
}

export const predictionChallenges: Record<string, PredictionChallenge[]> = {
  'newtons-second-law-cart': [
    {
      id: 'cart-double-hanging-mass',
      simSlug: 'newtons-second-law-cart',
      topicTitle: "System Mass & Acceleration",
      question:
        'If you double the hanging mass (from $m_h = 0.5\\text{ kg}$ to $1.0\\text{ kg}$) while keeping cart mass $m_c = 2.0\\text{ kg}$ constant, what happens to acceleration $a$?',
      options: [
        {
          id: 'A',
          label: 'Acceleration doubles ($2\\times$)',
          isCorrect: false,
          explanation:
            'Common Misconception: $a = \\frac{m_h g}{m_c + m_h}$. Doubling $m_h$ increases the driving force, but it ALSO increases total system inertia from $2.5\\text{ kg}$ to $3.0\\text{ kg}$. Therefore, $a$ increases by less than $2\\times$.',
        },
        {
          id: 'B',
          label: 'Acceleration increases, but by less than $2\\times$',
          isCorrect: true,
          explanation:
            'Correct! By Newton\'s 2nd Law for the system, $a = \\frac{m_h g}{m_c + m_h}$. When $m_h$ rises from $0.5$ to $1.0\\text{ kg}$, $a$ goes from $1.96\\text{ m/s}^2$ to $3.27\\text{ m/s}^2$ (a factor of $1.67\\times$, not $2\\times$).',
        },
        {
          id: 'C',
          label: 'Acceleration remains unchanged',
          isCorrect: false,
          explanation:
            'The accelerating net force is provided by the weight of the hanging mass ($m_h g$). Increasing $m_h$ directly increases the driving force.',
        },
        {
          id: 'D',
          label: 'Acceleration decreases because the system is heavier',
          isCorrect: false,
          explanation:
            'Although total inertia increases, the pulling force $m_h g$ increases by an even greater ratio, so acceleration must increase.',
        },
      ],
      testSetup: { mCart: 2.0, mHanger: 1.0, frictionEnabled: false },
      observePrompt:
        'Observe the acceleration readout: $a = 3.27\\text{ m/s}^2$, strictly less than $2 \\times 1.96 = 3.92\\text{ m/s}^2$.',
    },
    {
      id: 'cart-tension-vs-weight',
      simSlug: 'newtons-second-law-cart',
      topicTitle: "String Tension vs Weight",
      question:
        'When the cart accelerates freely to the right without friction, is the string tension $T$ equal to, greater than, or less than the hanging weight $m_h g$?',
      options: [
        {
          id: 'A',
          label: '$T = m_h g$ because the string holds the hanging mass',
          isCorrect: false,
          explanation:
            'If $T = m_h g$, the net vertical force on the hanging mass would be zero ($\\Sigma F_y = m_h g - T = 0$), so the hanger could never accelerate downward!',
        },
        {
          id: 'B',
          label: '$T < m_h g$ because the hanging mass accelerates downward',
          isCorrect: true,
          explanation:
            'Correct! Applying $\\Sigma F_y = m_h g - T = m_h a$ gives $T = m_h(g - a) < m_h g$. String tension only equals $m_h g$ in static equilibrium ($a = 0$).',
        },
        {
          id: 'C',
          label: '$T > m_h g$ to pull the cart forward',
          isCorrect: false,
          explanation:
            'If $T > m_h g$, the hanging mass would experience an upward net force and accelerate upwards!',
        },
      ],
      testSetup: { mCart: 2.0, mHanger: 0.5, frictionEnabled: false },
      observePrompt:
        'Notice $m_h g = 4.90\\text{ N}$, while the tension telemetry shows $T = 3.92\\text{ N} < 4.90\\text{ N}$.',
    },
  ],

  'friction': [
    {
      id: 'friction-static-magnitude',
      simSlug: 'friction',
      topicTitle: "Static Friction Magnitude",
      question:
        'A block ($m = 2.0\\text{ kg}$) with $\\mu_s = 0.50$ and $\\mu_k = 0.30$ is subjected to a push $F_{\\text{app}} = 4.0\\text{ N}$. What is the friction force $f$?',
      options: [
        {
          id: 'A',
          label: '$f = 9.8\\text{ N}$ (equal to $\\mu_s N$)',
          isCorrect: false,
          explanation:
            'Common Misconception: The formula $f_{s,\\text{max}} = \\mu_s N$ gives the MAXIMUM threshold before slipping, not the actual force. If friction were $9.8\\text{ N}$, pushing with $4\\text{ N}$ would cause the block to accelerate backwards!',
        },
        {
          id: 'B',
          label: '$f = 4.0\\text{ N}$ (exactly balances $F_{\\text{app}}$)',
          isCorrect: true,
          explanation:
            'Correct! Static friction is an adaptive constraint force: $f_s \\le \\mu_s N$. Since $F_{\\text{app}} = 4.0\\text{ N} < f_{s,\\text{max}} = 9.8\\text{ N}$, the block remains in static equilibrium with $f_s = F_{\\text{app}} = 4.0\\text{ N}$.',
        },
        {
          id: 'C',
          label: '$f = 5.88\\text{ N}$ (equal to $\\mu_k N$)',
          isCorrect: false,
          explanation:
            'Kinetic friction only acts when there is relative sliding motion between the surfaces. Since $F_{\\text{app}} < f_{s,\\text{max}}$, the block has not moved.',
        },
        {
          id: 'D',
          label: '$f = 0\\text{ N}$ because the block has not moved yet',
          isCorrect: false,
          explanation:
            'If friction were zero, any non-zero push $F_{\\text{app}}$ would instantly accelerate the block.',
        },
      ],
      testSetup: { mass: 2.0, mu_s: 0.5, mu_k: 0.3, F_app: 4.0 },
      observePrompt:
        'Notice $f = 4.00\\text{ N} = F_{\\text{app}}$, keeping net force $\\Sigma F = 0$ and $a = 0\\text{ m/s}^2$.',
    },
    {
      id: 'friction-kinetic-drop',
      simSlug: 'friction',
      topicTitle: "Slip Transition & Kinetic Drop",
      question:
        'If $F_{\\text{app}}$ increases to $11.0\\text{ N}$ (exceeding $f_{s,\\text{max}} = 9.8\\text{ N}$), what happens to the friction force $f$ once the block begins sliding?',
      options: [
        {
          id: 'A',
          label: 'Friction drops abruptly to kinetic friction $f_k = \\mu_k N = 5.88\\text{ N}$',
          isCorrect: true,
          explanation:
            'Correct! Once static microscopic interlocking bonds break, the coefficient drops to $\\mu_k = 0.30$. Friction drops discontinuously to $f_k = 5.88\\text{ N}$, resulting in net force $\\Sigma F = 11.0 - 5.88 = 5.12\\text{ N}$ and constant acceleration.',
        },
        {
          id: 'B',
          label: 'Friction stays at $9.8\\text{ N}$',
          isCorrect: false,
          explanation:
            'Static friction ceases the instant macroscopic sliding begins; kinetic friction governs sliding contact.',
        },
        {
          id: 'C',
          label: 'Friction increases to balance $11.0\\text{ N}$',
          isCorrect: false,
          explanation:
            'Static friction cannot exceed $f_{s,\\text{max}} = 9.8\\text{ N}$. Once exceeded, equilibrium is broken.',
        },
      ],
      testSetup: { mass: 2.0, mu_s: 0.5, mu_k: 0.3, F_app: 11.0 },
      observePrompt:
        'Look at the $f \\text{ vs } F_{\\text{app}}$ chart: notice the drop from the static peak to the constant kinetic plateau at $5.88\\text{ N}$.',
    },
  ],

  'newtons-third-law': [
    {
      id: 'third-law-mass-disparity',
      simSlug: 'newtons-third-law',
      topicTitle: "Third-Law Action-Reaction Pairs",
      question:
        'A heavy block $m_1 = 5.0\\text{ kg}$ pushes a light block $m_2 = 1.0\\text{ kg}$ across a frictionless surface with $F_{\\text{app}} = 12.0\\text{ N}$. How do the contact forces $|F_{1 \\to 2}|$ and $|F_{2 \\to 1}|$ compare?',
      options: [
        {
          id: 'A',
          label: '$|F_{1 \\to 2}| > |F_{2 \\to 1}|$ because block 1 is heavier and doing the pushing',
          isCorrect: false,
          explanation:
            'Classic Misconception: Students often equate exertion or greater mass with greater interaction force. By Newton\'s 3rd Law, the contact force is mutually shared equally!',
        },
        {
          id: 'B',
          label: '$|F_{1 \\to 2}| = |F_{2 \\to 1}|$ by Newton\'s Third Law',
          isCorrect: true,
          explanation:
            'Correct! In all physical interactions, $\\vec{F}_{1 \\to 2} = -\\vec{F}_{2 \\to 1}$. While block 2 accelerates at $a = \\frac{12}{5 + 1} = 2.0\\text{ m/s}^2$, the contact force on each is $m_2 a = 1.0 \\times 2.0 = 2.00\\text{ N}$ in opposite directions!',
        },
        {
          id: 'C',
          label: '$|F_{1 \\to 2}| < |F_{2 \\to 1}|$ because block 2 resists motion',
          isCorrect: false,
          explanation:
            'Resistance/inertia dictates acceleration, but never violates action-reaction symmetry.',
        },
      ],
      testSetup: { m1: 5.0, m2: 1.0, F_app: 12.0 },
      observePrompt:
        'Examine the interaction vector readouts: both $|F_{12}|$ and $|F_{21}|$ equal exactly $2.00\\text{ N}$.',
    },
  ],

  'work-energy-track': [
    {
      id: 'energy-mass-independence',
      simSlug: 'work-energy-track',
      topicTitle: "Speed Independence of Mass",
      question:
        'A frictionless cart is released from rest at height $h$ on a track. If you replace the cart with one that has $4\\times$ the mass, how does the speed $v$ at the bottom compare?',
      options: [
        {
          id: 'A',
          label: 'Speed is $4\\times$ greater because it has more momentum',
          isCorrect: false,
          explanation:
            'Gravitational force is $4\\times$ larger, but inertia to be accelerated is also $4\\times$ larger, cancelling out.',
        },
        {
          id: 'B',
          label: 'Speed is $2\\times$ greater because kinetic energy is quadratic',
          isCorrect: false,
          explanation:
            'Both potential energy and kinetic energy scale linearly with mass $m$, so mass cancels completely.',
        },
        {
          id: 'C',
          label: 'Speed is identical: $v = \\sqrt{2gh}$ does not depend on mass',
          isCorrect: true,
          explanation:
            'Correct! Mechanical energy conservation: $mgh = \\frac{1}{2}mv^2 \\implies v = \\sqrt{2gh}$. While total mechanical energy $E$ scales with $m$, speed $v$ at any elevation is completely independent of mass!',
        },
      ],
      testSetup: { mass: 8.0, initialSpeed: 0, preset: 'valley', frictionEnabled: false },
      observePrompt:
        'Compare the speed at the bottom with mass $8\\text{ kg}$ vs $2\\text{ kg}$: the speed at the valley is identical.',
    },
  ],

  'circular-motion': [
    {
      id: 'circular-centripetal-speed',
      simSlug: 'circular-motion',
      topicTitle: "Radial Acceleration Scaling",
      question:
        'A particle moves in a circle of constant radius $R$. If its speed $v$ is doubled, by what factor does centripetal acceleration $a_r$ change?',
      options: [
        {
          id: 'A',
          label: 'It doubles ($2\\times$)',
          isCorrect: false,
          explanation:
            'Linear acceleration would double, but centripetal acceleration depends quadratically on speed!',
        },
        {
          id: 'B',
          label: 'It quadruples ($4\\times$)',
          isCorrect: true,
          explanation:
            'Correct! Radial acceleration is $a_r = \\frac{v^2}{R} = \\omega^2 R$. Because of the quadratic dependence on speed $v$, doubling speed increases centripetal acceleration by a factor of $2^2 = 4\\times$!',
        },
        {
          id: 'C',
          label: 'It remains unchanged',
          isCorrect: false,
          explanation:
            'Higher speed requires a sharper rate of change of the direction of the velocity vector.',
        },
      ],
      testSetup: { R: 4.0, w0: 2.0, alpha: 0 },
      observePrompt:
        'With $R = 4\\text{ m}$ and $\\omega = 2\\text{ rad/s}$, observe $a_r = \\omega^2 R = 16.0\\text{ m/s}^2$. At the same $R$ with $\\omega = 1\\text{ rad/s}$, $a_r$ would be $4.0\\text{ m/s}^2$ — a factor of $4\\times$ smaller.',
    },
  ],

  'kinematics-graphs': [
    {
      id: 'kinematics-turnaround-point',
      simSlug: 'kinematics-graphs',
      topicTitle: "Turnaround Point Dynamics",
      question:
        'When an object reaches its turnaround point (maximum displacement where velocity reverses), what are $v$ and $a$?',
      options: [
        {
          id: 'A',
          label: '$v = 0$ and $a = 0$',
          isCorrect: false,
          explanation:
            'If both velocity and acceleration were zero, the object would remain permanently at rest and never turn around!',
        },
        {
          id: 'B',
          label: '$v = 0$, but $a \\ne 0$',
          isCorrect: true,
          explanation:
            'Correct! At the apex/turnaround, the position tangent is horizontal ($v = \\frac{dx}{dt} = 0$), but the slope of the $v-t$ curve is non-zero ($a = \\frac{dv}{dt} \\ne 0$), driving the change in velocity from positive to negative.',
        },
        {
          id: 'C',
          label: '$v > 0$ and $a = 0$',
          isCorrect: false,
          explanation:
            'At the turnaround point, velocity must cross zero.',
        },
      ],
      testSetup: { profile: 'turnaround', tCursor: 4.0 },
      observePrompt:
        'At cursor $t = 4.0\\text{ s}$, observe $v = 0.00\\text{ m/s}$ on the $v-t$ axis while $a = -2.00\\text{ m/s}^2$.',
    },
  ],

  'rotational-kinematics': [
    {
      id: 'rotational-tangential-accel',
      simSlug: 'rotational-kinematics',
      topicTitle: "Linear vs Angular Acceleration",
      question:
        'On a spinning disk with constant angular acceleration $\\alpha$, how does the tangential acceleration $a_t$ of a point compare at radius $2R$ versus radius $R$?',
      options: [
        {
          id: 'A',
          label: '$a_t$ is the same at both radii because $\\alpha$ is identical',
          isCorrect: false,
          explanation:
            'While angular acceleration $\\alpha$ is the same for the entire rigid body, tangential acceleration is a linear quantity: $a_t = \\alpha r$.',
        },
        {
          id: 'B',
          label: '$a_t$ is twice as large at $2R$ ($a_t = \\alpha r$)',
          isCorrect: true,
          explanation:
            'Correct! The linear relationship is $a_t = \\alpha r$. A point at twice the radial distance covers twice the arc length per radian of rotation, hence experiences twice the tangential acceleration.',
        },
        {
          id: 'C',
          label: '$a_t$ is half as large at $2R$',
          isCorrect: false,
          explanation:
            'Tangential acceleration scales directly with radius $r$, not inversely.',
        },
      ],
      testSetup: { profile: 'const-alpha', alpha: 2.0, w0: 0, R: 0.5, tCursor: 2.0 },
      observePrompt:
        'Observe $a_t = 1.0\\text{ m/s}^2$ at $r = 0.5\\text{ m}$, compared to $0.5\\text{ m/s}^2$ at $r = 0.25\\text{ m}$.',
    },
  ],

  'fixed-axis-rotation': [
    {
      id: 'inertia-mass-distribution',
      simSlug: 'fixed-axis-rotation',
      topicTitle: "Moment of Inertia & Mass Distribution",
      question:
        'A solid cylinder and a thin cylindrical hoop have identical total mass $M$ and radius $R$. Which has a smaller moment of inertia $I$?',
      options: [
        {
          id: 'A',
          label: 'The solid cylinder ($I = \\frac{1}{2}MR^2 < MR^2$)',
          isCorrect: true,
          explanation:
            'Correct! Moment of inertia depends on how mass is distributed relative to the rotation axis: $I = \\int r^2 dm$. In the solid cylinder, mass is distributed from $r=0$ to $R$, giving $I = \\frac{1}{2}MR^2$. In the thin hoop, all mass is at the maximum radius $R$, giving $I = MR^2$.',
        },
        {
          id: 'B',
          label: 'The thin hoop ($I = MR^2$)',
          isCorrect: false,
          explanation:
            'Because all the hoop\'s mass is concentrated at the maximum perimeter distance $R$, it possesses the maximum possible moment of inertia for radius $R$.',
        },
        {
          id: 'C',
          label: 'Both have the exact same moment of inertia because their masses are equal',
          isCorrect: false,
          explanation:
            'Rotational inertia depends strongly on the geometry of mass distribution, not just total mass.',
        },
      ],
      testSetup: { preset: 'solid-disk' },
      observePrompt:
        'Compare the moment of inertia formula and value: $I_{\\text{disk}} = 0.5 MR^2$ vs $I_{\\text{hoop}} = 1.0 MR^2$.',
    },
  ],

  'force-table-equilibrium': [
    {
      id: 'force-table-equilibrant',
      simSlug: 'force-table-equilibrium',
      topicTitle: "Resultant vs Equilibrant",
      question:
        'Two forces $\\vec{F}_1 = 5\\text{ N}$ at $0^\\circ$ and $\\vec{F}_2 = 5\\text{ N}$ at $90^\\circ$ pull the central ring. What equilibrant force $\\vec{E}$ establishes static equilibrium ($\\Sigma \\vec{F} = 0$)?',
      options: [
        {
          id: 'A',
          label: '$7.07\\text{ N}$ at $45^\\circ$',
          isCorrect: false,
          explanation:
            '$7.07\\text{ N}$ at $45^\\circ$ is the RESULTANT $\\vec{R} = \\vec{F}_1 + \\vec{F}_2$. Adding another force in the same direction would double the imbalance!',
        },
        {
          id: 'B',
          label: '$7.07\\text{ N}$ at $225^\\circ$ (equal in magnitude, opposite in direction)',
          isCorrect: true,
          explanation:
            'Correct! For static equilibrium, $\\Sigma \\vec{F} = \\vec{R} + \\vec{E} = 0 \\implies \\vec{E} = -\\vec{R}$. The equilibrant has magnitude $|\\vec{E}| = \\sqrt{5^2 + 5^2} \\approx 7.07\\text{ N}$ at $45^\\circ + 180^\\circ = 225^\\circ$.',
        },
        {
          id: 'C',
          label: '$10.0\\text{ N}$ at $180^\\circ$',
          isCorrect: false,
          explanation:
            'Forces add as vectors, not algebraic scalars ($5 + 5 = 10$ ignores perpendicular geometry).',
        },
      ],
      testSetup: { activeCount: 3, f1: 5, a1: 0, f2: 5, a2: 90, f3: 7.07, a3: 225 },
      observePrompt:
        'Notice the resultant magnitude $\\Sigma F = 0.00\\text{ N}$ and the pin remains centered in equilibrium.',
    },
  ],

  'instantaneous-velocity': [
    {
      id: 'secant-to-tangent',
      simSlug: 'instantaneous-velocity',
      topicTitle: "Average to Instantaneous Velocity",
      question:
        'As the time interval $\\Delta t = t_2 - t_1$ shrinks toward 0 on a position-time graph $x(t)$, what happens to the secant slope?',
      options: [
        {
          id: 'A',
          label: 'It shrinks to zero',
          isCorrect: false,
          explanation:
            'Although $\\Delta x \\to 0$ and $\\Delta t \\to 0$, their quotient $\\frac{\\Delta x}{\\Delta t}$ approaches a finite derivative, not zero.',
        },
        {
          id: 'B',
          label: 'It converges to the instantaneous velocity $v(t_1) = \\frac{dx}{dt}$ (tangent slope)',
          isCorrect: true,
          explanation:
            'Correct! By definition, $v(t) = \\lim_{\\Delta t \\to 0} \\frac{\\Delta x}{\\Delta t} = \\frac{dx}{dt}$. As $t_2 \\to t_1$, the secant line pivoting through both points rotates into the unique tangent line at $t_1$.',
        },
        {
          id: 'C',
          label: 'It approaches infinity',
          isCorrect: false,
          explanation:
            'Unless the object has infinite speed (teleportation), the quotient remains finite.',
        },
      ],
      testSetup: { dt: 0.1, t1: 2.0 },
      observePrompt:
        'Observe how the secant line overlays the green tangent line when $\\Delta t$ shrinks down to $0.1\\text{ s}$.',
    },
  ],
};
