import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/layout/Dashboard';
import Home from './pages/Home';
import ForTeachers from './pages/ForTeachers';
import About from './pages/About';
import SimGuidePage from './pages/SimGuidePage';
import InstantaneousVelocity from './pages/simulations/InstantaneousVelocity';
import KinematicsGraphs from './pages/simulations/KinematicsGraphs';
import FrictionAppliedForce from './pages/simulations/FrictionAppliedForce';
import CircularMotion from './pages/simulations/CircularMotion';
import NewtonsThirdLaw from './pages/simulations/NewtonsThirdLaw';
import NewtonsSecondLawCart from './pages/simulations/NewtonsSecondLawCart';
import ForceTableEquilibrium from './pages/simulations/ForceTableEquilibrium';
import WorkEnergyTrack from './pages/simulations/WorkEnergyTrack';
import FixedAxisRotation from './pages/simulations/FixedAxisRotation';
import RotationalKinematics from './pages/simulations/RotationalKinematics';
import ProblemSetsPage from './pages/ProblemSetsPage';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route path="/" element={<Dashboard />}>
          <Route index element={<Home />} />
          <Route path="for-teachers" element={<ForTeachers />} />
          <Route path="about" element={<About />} />
          <Route path="problems" element={<ProblemSetsPage />} />
          <Route path="guides/:slug" element={<SimGuidePage />} />
          <Route path="simulations/instantaneous-velocity" element={<InstantaneousVelocity />} />
          <Route path="simulations/kinematics-graphs" element={<KinematicsGraphs />} />
          <Route path="simulations/friction" element={<FrictionAppliedForce />} />
          <Route path="simulations/circular-motion" element={<CircularMotion />} />
          <Route path="simulations/newtons-third-law" element={<NewtonsThirdLaw />} />
          <Route path="simulations/newtons-second-law-cart" element={<NewtonsSecondLawCart />} />
          <Route path="simulations/force-table-equilibrium" element={<ForceTableEquilibrium />} />
          <Route path="simulations/work-energy-track" element={<WorkEnergyTrack />} />
          <Route path="simulations/fixed-axis-rotation" element={<FixedAxisRotation />} />
          <Route path="simulations/rotational-kinematics" element={<RotationalKinematics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
