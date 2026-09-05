import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  Circle,
  Box,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Scale,
  Mountain,
  RotateCw,
  GraduationCap,
  Menu,
  X,
  Info,
  LineChart,
  Orbit,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import {
  simulations,
  simulationsByTopic,
  TOPIC_GROUP_LABELS,
  getSimulation,
} from '../../content/simulations';
import type { SimIconName } from '../../content/types';
import { TeacherUnlockProvider } from '../../hooks/useTeacherUnlock';
import { LayoutContext } from './LayoutContext';

const ICON_MAP: Record<SimIconName, LucideIcon> = {
  activity: Activity,
  box: Box,
  circle: Circle,
  'arrow-right': ArrowRight,
  gauge: Gauge,
  scale: Scale,
  mountain: Mountain,
  'rotate-cw': RotateCw,
  chart: LineChart,
  orbit: Orbit,
};

function pageTitle(pathname: string): string {
  if (pathname === '/' || pathname === '') return 'Home';
  if (pathname === '/for-teachers') return 'For Teachers';
  if (pathname === '/about') return 'About';
  if (pathname === '/problems') return 'Problem sets';
  if (pathname.startsWith('/guides/')) {
    const slug = pathname.replace('/guides/', '');
    return getSimulation(slug)?.shortTitle
      ? `Tips: ${getSimulation(slug)!.shortTitle}`
      : 'Tips & Revision';
  }
  if (pathname.startsWith('/simulations/')) {
    const slug = pathname.replace('/simulations/', '');
    return getSimulation(slug)?.shortTitle ?? 'Simulation';
  }
  return 'SN1 Mechanics';
}

function NavBody({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const groups = simulationsByTopic();
  const location = useLocation();
  const onGuideTab = location.pathname.startsWith('/simulations/') && location.search.includes('tab=guide');
  const guideSlug = location.pathname.startsWith('/guides/')
    ? location.pathname.replace(/^\/guides\//, '').split(/[/?#]/)[0]
    : onGuideTab
      ? location.pathname.replace(/^\/simulations\//, '').split(/[/?#]/)[0]
      : null;

  return (
    <>
      <NavLink
        to="/"
        end
        onClick={onNavigate}
        title={collapsed ? 'Home' : undefined}
        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}${collapsed ? ' collapsed' : ''}`}
      >
        <BookOpen size={17} className="nav-link-icon" />
        {!collapsed && <span>Home</span>}
      </NavLink>

      <NavLink
        to="/problems"
        onClick={onNavigate}
        title={collapsed ? 'Problem sets' : undefined}
        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}${collapsed ? ' collapsed' : ''}`}
      >
        <ClipboardList size={17} className="nav-link-icon" />
        {!collapsed && <span>Problem sets</span>}
      </NavLink>

      <NavLink
        to="/for-teachers"
        onClick={onNavigate}
        title={collapsed ? 'For Teachers' : undefined}
        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}${collapsed ? ' collapsed' : ''}`}
      >
        <GraduationCap size={17} className="nav-link-icon" />
        {!collapsed && <span>For Teachers</span>}
      </NavLink>

      <NavLink
        to="/about"
        onClick={onNavigate}
        title={collapsed ? 'About' : undefined}
        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}${collapsed ? ' collapsed' : ''}`}
      >
        <Info size={17} className="nav-link-icon" />
        {!collapsed && <span>About</span>}
      </NavLink>

      {groups.map(({ group, items }) => (
        <div key={group} className="nav-group">
          {!collapsed && (
            <div className="nav-group-label">{TOPIC_GROUP_LABELS[group]}</div>
          )}
          {items.map((sim) => {
            const Icon = ICON_MAP[sim.icon];
            const isCurrentSim = location.pathname === sim.simPath;
            const isCurrentGuide = guideSlug === sim.slug;
            return (
              <div key={sim.slug} className="nav-sim-block">
                <NavLink
                  to={sim.simPath}
                  onClick={onNavigate}
                  title={collapsed ? sim.shortTitle : undefined}
                  className={({ isActive }) =>
                    `nav-link${isActive && !onGuideTab ? ' active' : ''}${collapsed ? ' collapsed' : ''}`
                  }
                >
                  <Icon size={17} className="nav-link-icon" />
                  {!collapsed && <span>{sim.shortTitle}</span>}
                </NavLink>
                {!collapsed && (isCurrentSim || isCurrentGuide) && (
                  <NavLink
                    to={`${sim.simPath}?tab=guide`}
                    onClick={onNavigate}
                    className={`nav-link nav-sublink${isCurrentGuide ? ' active' : ''}`}
                  >
                    <span>Tips &amp; Revision</span>
                  </NavLink>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

const Sidebar = ({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) => {
  return (
    <nav
      className="sidebar desktop-sidebar"
      style={{
        width: collapsed ? '64px' : '220px',
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0 0 24px 0' : '0 16px 24px 16px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {!collapsed && (
          <div>
            <h2
              style={{
                fontSize: '15px',
                color: 'var(--primary)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Box size={18} />
              SN1 Mechanics
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Interactive Physics
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="icon-btn"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div
        className="sidebar-nav-scroll"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          padding: '0 8px',
          overflowY: 'auto',
          flex: 1,
        }}
      >
        <NavBody collapsed={collapsed} />
      </div>
    </nav>
  );
};

export const Dashboard = () => {
  const location = useLocation();
  const onSim = location.pathname.startsWith('/simulations/');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sn1-sidebar-collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [wideCanvas, setWideCanvas] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = useMemo(() => pageTitle(location.pathname), [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem('sn1-sidebar-collapsed', sidebarCollapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    setMobileOpen(false);
    if (onSim) setSidebarCollapsed(true);
    else setWideCanvas(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <LayoutContext.Provider
      value={{ sidebarCollapsed, setSidebarCollapsed, wideCanvas, setWideCanvas }}
    >
      <TeacherUnlockProvider>
      <div className={`app-container${wideCanvas ? ' wide-canvas' : ''}`}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />

        <div className="main-column">
          <header className="mobile-topbar">
            <button
              type="button"
              className="icon-btn"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="mobile-topbar-title">{title}</div>
            <span className="mobile-topbar-badge">SN1</span>
          </header>

          {mobileOpen && (
            <div className="mobile-drawer-root">
              <button
                type="button"
                className="mobile-drawer-backdrop"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              />
              <nav className="mobile-drawer" aria-label="Simulations">
                <div className="mobile-drawer-header">
                  <div>
                    <div className="mobile-drawer-brand">SN1 Mechanics</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {simulations.length} simulations
                    </div>
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Close menu"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="mobile-drawer-links">
                  <NavBody collapsed={false} onNavigate={() => setMobileOpen(false)} />
                </div>
              </nav>
            </div>
          )}

          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
      </TeacherUnlockProvider>
    </LayoutContext.Provider>
  );
};
