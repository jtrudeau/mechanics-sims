import type { SimulationEntry, TopicGroup } from './types';
import { TOPIC_GROUP_ORDER } from './types';
import { instantaneousVelocityGuide } from './guides/instantaneous-velocity';
import { frictionGuide } from './guides/friction';
import { circularMotionGuide } from './guides/circular-motion';
import { newtonsThirdLawGuide } from './guides/newtons-third-law';
import { newtonsSecondLawCartGuide } from './guides/newtons-second-law-cart';
import { forceTableGuide } from './guides/force-table-equilibrium';
import { workEnergyTrackGuide } from './guides/work-energy-track';
import { fixedAxisRotationGuide } from './guides/fixed-axis-rotation';
import { kinematicsGraphsGuide } from './guides/kinematics-graphs';
import { rotationalKinematicsGuide } from './guides/rotational-kinematics';

export const simulations: SimulationEntry[] = [
  {
    slug: 'instantaneous-velocity',
    title: 'Instantaneous Velocity via Tangent',
    shortTitle: 'Instantaneous Velocity',
    topicGroup: 'kinematics',
    blurb: 'Relate the secant slope to the tangent as Δt shrinks on an x–t graph.',
    icon: 'activity',
    simPath: '/simulations/instantaneous-velocity',
    guidePath: '/guides/instantaneous-velocity',
    learningGoalOneLiner: 'Distinguish average and instantaneous velocity on position–time graphs.',
    guide: instantaneousVelocityGuide,
  },
  {
    slug: 'kinematics-graphs',
    title: 'Kinematics Graphs',
    shortTitle: 'Kinematics Graphs',
    topicGroup: 'kinematics',
    blurb: 'Stacked x–t, v–t, and a–t graphs: slope is velocity or acceleration; area is Δx or Δv.',
    icon: 'chart',
    simPath: '/simulations/kinematics-graphs',
    guidePath: '/guides/kinematics-graphs',
    learningGoalOneLiner: 'Read slope and signed area on the three standard 1-D kinematics graphs.',
    guide: kinematicsGraphsGuide,
  },
  {
    slug: 'friction',
    title: 'Friction vs Applied Force',
    shortTitle: 'Friction vs Applied Force',
    topicGroup: 'forces',
    blurb: 'Identify the static friction limit and the transition to kinetic friction.',
    icon: 'box',
    simPath: '/simulations/friction',
    guidePath: '/guides/friction',
    learningGoalOneLiner: 'Relate static and kinetic friction to the free-body diagram.',
    guide: frictionGuide,
  },
  {
    slug: 'circular-motion',
    title: 'Uniform vs Non-Uniform Circular Motion',
    shortTitle: 'Circular Motion',
    topicGroup: 'kinematics',
    blurb: 'Resolve acceleration into radial and tangential components on a circular path.',
    icon: 'circle',
    simPath: '/simulations/circular-motion',
    guidePath: '/guides/circular-motion',
    learningGoalOneLiner: 'Relate a_r and a_t to changes in direction and speed.',
    guide: circularMotionGuide,
  },
  {
    slug: 'newtons-third-law',
    title: "Newton's 3rd Law",
    shortTitle: "Newton's 3rd Law",
    topicGroup: 'forces',
    blurb: 'Equal-and-opposite pairs for side-by-side, stacked, and incline setups.',
    icon: 'arrow-right',
    simPath: '/simulations/newtons-third-law',
    guidePath: '/guides/newtons-third-law',
    learningGoalOneLiner: 'Distinguish a third-law pair from the net force that produces a.',
    guide: newtonsThirdLawGuide,
  },
  {
    slug: 'newtons-second-law-cart',
    title: "Newton's 2nd Law: Cart and Hanging Mass",
    shortTitle: "Newton's 2nd Law Cart",
    topicGroup: 'forces',
    blurb: 'Acceleration, tension, and optional friction for a cart and hanging mass.',
    icon: 'gauge',
    simPath: '/simulations/newtons-second-law-cart',
    guidePath: '/guides/newtons-second-law-cart',
    learningGoalOneLiner: 'Apply ΣF = ma to the system and to each object’s free-body diagram.',
    guide: newtonsSecondLawCartGuide,
  },
  {
    slug: 'force-table-equilibrium',
    title: 'Static Equilibrium: Force Table',
    shortTitle: 'Force Table Equilibrium',
    topicGroup: 'forces',
    blurb: 'Resolve forces into components; construct the resultant and the equilibrant.',
    icon: 'scale',
    simPath: '/simulations/force-table-equilibrium',
    guidePath: '/guides/force-table-equilibrium',
    learningGoalOneLiner: 'Apply ΣF = 0 with force-table vectors and components.',
    guide: forceTableGuide,
  },
  {
    slug: 'work-energy-track',
    title: 'Work and Mechanical Energy on a Track',
    shortTitle: 'Work-Energy Track',
    topicGroup: 'energy-rotation',
    blurb: 'Exchange between K and U_g on a track, including frictional dissipation.',
    icon: 'mountain',
    simPath: '/simulations/work-energy-track',
    guidePath: '/guides/work-energy-track',
    learningGoalOneLiner: 'Account for mechanical energy and turning points on a constrained track.',
    guide: workEnergyTrackGuide,
  },
  {
    slug: 'fixed-axis-rotation',
    title: 'Torque and Fixed-Axis Rotation',
    shortTitle: 'Fixed-Axis Rotation',
    topicGroup: 'energy-rotation',
    blurb: 'Relate torque, moment of inertia, and angular acceleration for rigid bodies.',
    icon: 'rotate-cw',
    simPath: '/simulations/fixed-axis-rotation',
    guidePath: '/guides/fixed-axis-rotation',
    learningGoalOneLiner: 'Use the rotational analogues τ ↔ F, I ↔ m, and α ↔ a.',
    guide: fixedAxisRotationGuide,
  },
  {
    slug: 'rotational-kinematics',
    title: 'Rotational Kinematics Graphs',
    shortTitle: 'Rotational Kinematics',
    topicGroup: 'energy-rotation',
    blurb: 'Stacked θ–t, ω–t, and α–t graphs: slope and signed area for fixed-axis rotation.',
    icon: 'orbit',
    simPath: '/simulations/rotational-kinematics',
    guidePath: '/guides/rotational-kinematics',
    learningGoalOneLiner: 'Read θ, ω, and α graphs as the rotational analogues of x, v, and a.',
    guide: rotationalKinematicsGuide,
  },
];

export function getSimulation(slug: string): SimulationEntry | undefined {
  return simulations.find((s) => s.slug === slug);
}

export function simulationsByTopic(): { group: TopicGroup; items: SimulationEntry[] }[] {
  return TOPIC_GROUP_ORDER.map((group) => ({
    group,
    items: simulations.filter((s) => s.topicGroup === group),
  }));
}

export { TOPIC_GROUP_LABELS, TOPIC_GROUP_ORDER } from './types';
