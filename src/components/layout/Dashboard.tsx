import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Activity, BookOpen, Circle, Box, ArrowRight } from 'lucide-react';

const Sidebar = () => {
  const links = [
    { to: "/", label: "Home", icon: <BookOpen size={18} /> },
    { to: "/simulations/instantaneous-velocity", label: "Instantaneous Velocity", icon: <Activity size={18} /> },
    { to: "/simulations/friction", label: "Friction vs Applied Force", icon: <Box size={18} /> },
    { to: "/simulations/circular-motion", label: "Circular Motion", icon: <Circle size={18} /> },
    { to: "/simulations/newtons-third-law", label: "Newton's 3rd Law", icon: <ArrowRight size={18} /> },
  ];

  return (
    <nav className="sidebar">
      <div style={{ padding: '0 24px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Box size={24} />
          SN1 Mechanics
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Interactive Physics</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              color: isActive ? 'var(--primary)' : 'var(--text-main)',
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              fontWeight: isActive ? 600 : 500,
              fontSize: '14px',
              transition: 'all 0.2s ease',
            })}
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export const Dashboard = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
