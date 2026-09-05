export type TopicGroup = 'kinematics' | 'forces' | 'energy' | 'rotation';

export type SimIconName =
  | 'activity'
  | 'box'
  | 'circle'
  | 'arrow-right'
  | 'gauge'
  | 'scale'
  | 'mountain'
  | 'rotate-cw'
  | 'chart'
  | 'orbit';

export interface RevisionProblem {
  id: string;
  prompt: string;
  hint: string;
  checkWithSim: string[];
  answer: string;
  /** Query params to seed the live sim when opening from the guide. */
  simParams?: Record<string, string | number | boolean>;
}

export interface SimGuideContent {
  learningGoals: string[];
  howToUse: string[];
  watchFors: string[];
  canvasTips: string[];
  tryThis: string;
  revisionProblems: RevisionProblem[];
}

export interface SimulationMeta {
  slug: string;
  title: string;
  shortTitle: string;
  topicGroup: TopicGroup;
  blurb: string;
  icon: SimIconName;
  simPath: string;
  guidePath: string;
  learningGoalOneLiner: string;
}

export interface SimulationEntry extends SimulationMeta {
  guide: SimGuideContent;
}

export const TOPIC_GROUP_LABELS: Record<TopicGroup, string> = {
  kinematics: 'Kinematics',
  forces: 'Dynamics & Forces',
  energy: 'Work & Energy',
  rotation: 'Rotational Dynamics',
};

export const TOPIC_GROUP_ORDER: TopicGroup[] = [
  'kinematics',
  'forces',
  'energy',
  'rotation',
];
