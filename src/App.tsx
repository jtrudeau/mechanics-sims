import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/layout/Dashboard';
import Home from './pages/Home';
import InstantaneousVelocity from './pages/simulations/InstantaneousVelocity';
import FrictionAppliedForce from './pages/simulations/FrictionAppliedForce';
import CircularMotion from './pages/simulations/CircularMotion';
import NewtonsThirdLaw from './pages/simulations/NewtonsThirdLaw';

function App() {
  return (
    <BrowserRouter basename="/mechanics-sims">
      <Routes>
        <Route path="/" element={<Dashboard />}>
          <Route index element={<Home />} />
          <Route path="simulations/instantaneous-velocity" element={<InstantaneousVelocity />} />
          <Route path="simulations/friction" element={<FrictionAppliedForce />} />
          <Route path="simulations/circular-motion" element={<CircularMotion />} />
          <Route path="simulations/newtons-third-law" element={<NewtonsThirdLaw />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
