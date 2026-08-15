import { simulations } from './simulations';

export const forTeachers = {
  suiteTitle: 'SN1 Mechanics Simulations',
  courseLine:
    'Interactive figures for Mechanics (203-SN1-RE) and related college classical mechanics courses.',
  purpose: [
    'Connect equations, free-body diagrams, and graphs to the motion shown on the canvas.',
    'Support a short cycle of prediction, interaction, and explanation in class or as homework.',
    'Provide Tips & Revision pages with formative problems tied to each simulation.',
  ],
  scopeNotes: [
    'These pages are formative tools. They are not an LMS, an auto-graded quiz system, or a replacement for laboratory measurement.',
    'Learning still depends on instructor framing and student explanation; the simulations alone do not certify understanding.',
  ],
  activityPattern: {
    title: 'Suggested 10–15 minute pattern',
    steps: [
      {
        name: 'Predict (2–3 min)',
        detail:
          'Pose one question from the Suggested exercise panel or a revision problem. Students record a brief prediction before changing controls.',
      },
      {
        name: 'Interact (5–7 min)',
        detail:
          'Open the simulation, set the indicated parameters, and compare Live Dynamics with the prediction. Expand Theory after the first attempt if needed.',
      },
      {
        name: 'Explain (3–5 min)',
        detail:
          'Students revise their account using Learning goals and Common difficulties on the Tips & Revision page. Address one misconception from that list.',
      },
    ],
  },
  revisionUse: [
    'Hints and worked solutions stay hidden until you unlock them (passphrase on this page). Check still grades an attempt without showing the write-up.',
    'Unlock lasts for this browser tab. Lock (or close the tab) before a student uses the same machine.',
    'For a closed warm-up on a projector, open Tips & Revision with ?quiz=1 so answers stay hidden even if this tab is unlocked.',
    'Use Load setup on a problem to open the simulation with matching control values.',
    'The Problem sets page (/problems) begins with short checks, then a multi-step homework / class problem with a figure. Unlock to see per-part solutions and a full teacher write-up. Progress is local only.',
    'Ask pairs to agree on an answer before you unlock and walk through the explanation.',
  ],
  suggestedSequence: [
    'Instantaneous velocity, then Kinematics graphs (slope and area on x–t, v–t, a–t).',
    'Friction, Newton’s third law, then Newton’s second law (cart and hanger).',
    'Force table (vector components and ΣF = 0) alongside or just before Newton applications.',
    'Circular motion once students are comfortable with two-dimensional kinematics.',
    'Work and energy on a track, then torque / fixed-axis rotation, then Rotational kinematics graphs.',
    'Assign Problem sets as homework or an exit ticket; Load setup opens the matching simulation.',
  ],
  classroomLogistics: [
    'On a projector, collapse the sidebar and keep attention on the canvas; the companion column scrolls separately on desktop.',
    'On phones and small tablets, use the menu in the top bar (the desktop sidebar is hidden below 540 px width).',
    'Students may keep the simulation and Tips & Revision open in two tabs, or use the header link.',
    'Do not put the solution passphrase in student handouts. It is a classroom deterrent, not an account system.',
  ],
  simIndex: simulations.map((s) => ({
    title: s.shortTitle,
    goal: s.learningGoalOneLiner,
    simPath: s.simPath,
    guidePath: s.guidePath,
    topicGroup: s.topicGroup,
  })),
};

export const aboutPage = {
  title: 'About',
  eyebrow: 'Authorship · Contact',
  lead:
    'This suite was developed for college Mechanics instruction, with Dawson College’s 203-SN1-RE (Science Naturelles 1) as the primary course context.',
  author: {
    name: 'Joel Trudeau',
    role: 'Physics teacher, Dawson College',
    office: '7A.20',
    local: '4019',
    email: 'jtrudeau@dawsoncollege.qc.ca',
  },
  projectNotes: [
    'The simulations began as standalone HTML prototypes and were consolidated into a single React application so that layout, vector styling, and pedagogical scaffolding stay consistent across topics.',
    'Each simulation pairs a live canvas with a Tips & Revision page: learning goals, operating notes, common difficulties, and formative problems that can load a matching control setup.',
    'A Problem sets hub lets students check numeric and multiple-choice answers in the browser; hints and worked solutions stay locked until an instructor unlocks them on this device. Progress stays on the device.',
    'The For Teachers page describes a short classroom pattern and a suggested topic order. Hosting may use GitHub Pages or institutional servers as deployment decisions mature.',
  ],
  acknowledgements:
    'Course framing follows the Dawson College Mechanics (203-SN1-RE) syllabus. Colleagues teaching other sections of the same course share that curriculum context.',
  repoNote:
    'Source is at github.com/jtrudeau/mechanics-sims. Clone, install, and run from the repository root.',
};
