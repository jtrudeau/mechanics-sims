import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Activity, BookOpen, Circle, Box, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const links = [
  { to: "/", label: "Home", icon: BookOpen },
  { to: "/simulations/instantaneous-velocity", label: "Instantaneous Velocity", icon: Activity },
  { to: "/simulations/friction", label: "Friction vs Applied Force", icon: Box },
  { to: "/simulations/circular-motion", label: "Circular Motion", icon: Circle },
  { to: "/simulations/newtons-third-law", label: "Newton's 3rd Law", icon: ArrowRight },
];

const Sidebar = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => {
  return (
    <nav
      className="sidebar"
      style={{
        width: collapsed ? '64px' : '220px',
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0 0 24px 0' : '0 16px 24px 16px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}>
        {!collapsed && (
          <div>
            <h2 style={{ fontSize: '15px', color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={18} />
              SN1 Mechanics
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Interactive Physics</p>
          </div>
        )}
        <button
          onClick={onToggle}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            padding: '4px',
            borderRadius: 'var(--radius-sm)',
            flexShrink: 0,
            width: '28px',
            height: '28px',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: collapsed ? '0 8px' : '0 8px' }}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              title={collapsed ? link.label : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '10px 0' : '9px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: isActive ? 'var(--primary)' : 'var(--text-main)',
                background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              })}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-container">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
