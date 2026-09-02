import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import AccountModal from '../components/AccountModal';
import PomodoroFab from '../components/PomodoroFab';
import ScrollToTopFab from '../components/ScrollToTopFab';
import SubscribeGateModal from '../components/SubscribeGateModal';
import { usePomodoro } from '../context/PomodoroContext';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></> },
  { label: 'Practice Engine', path: '/practice', icon: <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /> },
  { label: 'Mock Exam', path: '/mock', icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
  { label: 'Categories', path: '/categories', icon: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /> },
  { label: 'Bookmarks', path: '/bookmarks', countKey: 'bookmarkCount', icon: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /> },
  { label: 'Incorrect Bank', path: '/incorrect', countKey: 'wrongQuestionCount', icon: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></> },
  { label: 'Live Analytics', path: '/analytics', icon: <><path d="M18 20V10M12 20V4M6 20v-6" /></> },
  { label: 'Reports', path: '/reports', adminOnly: true, icon: <><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h5M8 17h8" /></> },
  { label: 'Settings', path: '/settings', icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a2 2 0 0 0-1.51 1z" /></> },
];

const titles = {
  dashboard: 'Dashboard',
  practice: 'Practice Engine',
  mock: 'Mock Exam',
  categories: 'Categories',
  bookmarks: 'Bookmarks',
  incorrect: 'Incorrect Bank',
  analytics: 'Live Analytics',
  'add-question': 'Add Question',
  reports: 'Reported Questions',
  settings: 'Settings',
};

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
}

function PortalLayout() {
  const { user, logout } = useAuth();
  const { xp, bookmarkCount, wrongQuestionCount, progress } = useApp();
  const { phase, display, running, toggle } = usePomodoro();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('prep_with_pro_theme') || 'light');
  const [showSubscribeGate, setShowSubscribeGate] = useState(() => !localStorage.getItem('prep_with_pro_subscribe_gate_seen'));

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem('prep_with_pro_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle('compact-mode', Boolean(progress.settings?.compactMode));
    if (typeof progress.settings?.darkMode === 'boolean') setTheme(progress.settings.darkMode ? 'dark' : 'light');
  }, [progress.settings]);

  const currentKey = location.pathname.split('/')[1] || 'dashboard';
  const currentTitle = titles[currentKey] || 'Dashboard';
  const visibleItems = user.role === 'admin'
    ? [...navItems.slice(0, 7), { label: 'Add Question', path: '/add-question', icon: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></> }, navItems[7], navItems[8]]
    : navItems.filter((item) => !item.adminOnly);

  function countFor(item) {
    if (item.countKey === 'bookmarkCount') return bookmarkCount;
    if (item.countKey === 'wrongQuestionCount') return wrongQuestionCount;
    return null;
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  function toggleSidebar() {
    if (window.matchMedia('(max-width: 900px)').matches) {
      setMobileOpen((open) => !open);
      return;
    }

    setCollapsed((value) => !value);
  }

  return (
    <>
      <aside id="sidebar" style={collapsed ? { width: '80px' } : undefined} className={`${collapsed ? 'collapsed ' : ''}${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5V15a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4.5M14 19.5V14a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5.5M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /></svg>
          <span>Prep With Pro</span>
        </div>
        <ul className="sidebar-menu">
          {visibleItems.map((item) => (
            <li key={item.path}>
              <NavLink className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`} to={item.path} onClick={closeMobileMenu}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                <span>{item.label}</span>
                {item.countKey && <span className="item-badge">{countFor(item)}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
        <button className="sidebar-footer account-trigger" type="button" onClick={() => setAccountOpen(true)}>
          <span className="account-avatar">{initials(user.name)}</span>
          <span className="user-meta"><strong>{user.name}</strong><small>{user.role === 'admin' ? 'Administrator' : 'Candidate'}</small></span>
        </button>
      </aside>

      <button className={`sidebar-overlay${mobileOpen ? ' active' : ''}`} type="button" aria-label="Close navigation" onClick={closeMobileMenu} />

      <main id="main-content" className={collapsed ? 'portal-main-collapsed' : ''}>
        <header>
          <div className="portal-header-start">
            <button className="btn btn-secondary" type="button" aria-label="Toggle sidebar" onClick={toggleSidebar}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <h2 id="current-page-title">{currentTitle}</h2>
          </div>
          <div className="portal-header-actions">
            <div className="pomo-widget"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg><span>{phase === 'Focus' ? 'Focus' : 'Break'}</span><span className="pomo-time">{display}</span><button className="pomo-play-button" type="button" aria-label={running ? 'Pause focus timer' : 'Start focus timer'} onClick={toggle}><svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">{running ? <path d="M6 5h4v14H6zM14 5h4v14h-4z" /> : <path d="M8 5v14l11-7z" />}</svg></button></div>
            <div className="xp-pill"><span aria-hidden="true">XP</span> {xp}</div>
            <button className="btn btn-secondary icon-button" type="button" title="Toggle Theme" aria-label="Toggle theme" onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <svg className="header-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg> : <svg className="header-icon-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A8.5 8.5 0 0 1 11.2 3a8.5 8.5 0 1 0 9.8 9.8Z" /></svg>}
            </button>
            <button className="btn btn-secondary icon-button" type="button" title="Fullscreen Mode" aria-label="Toggle fullscreen" onClick={toggleFullscreen}><svg className="header-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5M3 3l6 6M21 3l-6 6M3 21l6-6M21 21l-6-6" /></svg></button>
          </div>
        </header>
        <Outlet />
      </main>

      <div className="fab-container"><PomodoroFab /><ScrollToTopFab /></div>

      {accountOpen && <AccountModal onClose={() => setAccountOpen(false)} />}
      {showSubscribeGate && <SubscribeGateModal onContinue={() => { localStorage.setItem('prep_with_pro_subscribe_gate_seen', 'true'); setShowSubscribeGate(false); }} />}
    </>
  );
}

export default PortalLayout;
