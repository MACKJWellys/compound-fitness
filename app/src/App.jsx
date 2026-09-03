import { useState } from 'react';
import Dashboard from './screens/Dashboard';
import PRBook from './screens/PRBook';
import Programme from './screens/Programme';
import SessionScreen from './screens/SessionScreen';
import Calendar from './screens/Calendar';
import Settings from './screens/Settings';
import { DAYS, FREESTYLE_SESSION, FREESTYLE_INDEX } from './data/programme';
import { getActiveSession, saveActiveSession } from './data/storage';

const ICON = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' };

const TABS = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg {...ICON}>
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    id: 'prbook',
    label: 'PR Book',
    icon: (
      <svg {...ICON}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
        <path d="M8 7h8M8 11h6" />
      </svg>
    ),
  },
  {
    id: 'programme',
    label: 'Programme',
    icon: (
      <svg {...ICON}>
        <path d="M4 6h16M4 12h16M4 18h10" />
        <path d="M18 15v6M15 18h6" />
      </svg>
    ),
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: (
      <svg {...ICON}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 2v4M16 2v4" />
        <path d="M8 14h.01M12 14h.01M16 14h.01" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Data',
    icon: (
      <svg {...ICON}>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
        <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
      </svg>
    ),
  },
];

function sessionForIndex(i) {
  if (i === FREESTYLE_INDEX) return FREESTYLE_SESSION;
  return DAYS[i] || null;
}

function sessionForName(name) {
  if (name === FREESTYLE_SESSION.name) return FREESTYLE_SESSION;
  return DAYS.find((d) => d.name === name) || null;
}

function indexForSession(session) {
  if (!session) return 0;
  if (session.freestyle) return FREESTYLE_INDEX;
  const idx = DAYS.findIndex((d) => d.name === session.name);
  return idx >= 0 ? idx : 0;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeSession, setActiveSession] = useState(() => {
    const saved = getActiveSession();
    return saved ? sessionForIndex(saved.sessionIndex) : null;
  });
  const [activeSessionIndex, setActiveSessionIndex] = useState(() => {
    const saved = getActiveSession();
    return saved?.sessionIndex ?? 0;
  });
  const [historySession, setHistorySession] = useState(null);
  const [sessionDateOverride, setSessionDateOverride] = useState(null);
  const [sessionLogVersion, setSessionLogVersion] = useState(0);
  // Mirrors what's in localStorage so Dashboard can react without remounting
  const [savedSessionData, setSavedSessionData] = useState(() => getActiveSession());

  function closeSessionOverlay() {
    setActiveSession(null);
    setHistorySession(null);
    setSessionDateOverride(null);
    // Re-read storage — data is still there if the user pressed back without completing
    setSavedSessionData(getActiveSession());
  }

  function handleStartSession(session) {
    // Starting a fresh session — discard any in-progress one
    saveActiveSession(null);
    setSavedSessionData(null);
    setActiveSessionIndex(indexForSession(session));
    setActiveSession(session);
    setHistorySession(null);
    setSessionDateOverride(null);
  }

  function handleContinueSession() {
    const saved = getActiveSession();
    if (!saved) return;
    const dayDef = sessionForIndex(saved.sessionIndex);
    if (!dayDef) return;
    setActiveSessionIndex(saved.sessionIndex);
    setActiveSession(dayDef);
    setHistorySession(null);
    setSessionDateOverride(null);
  }

  function handleViewSession(logEntry) {
    const dayDef = sessionForName(logEntry.sessionName) || DAYS[0];
    setActiveSessionIndex(indexForSession(dayDef));
    setActiveSession(dayDef);
    setHistorySession(logEntry);
    setSessionDateOverride(null);
  }

  function handleCreateSession(dateStr, sessionName) {
    const dayDef = sessionForName(sessionName);
    if (!dayDef) return;
    setActiveSessionIndex(indexForSession(dayDef));
    setActiveSession(dayDef);
    setHistorySession(null);
    setSessionDateOverride(dateStr);
  }

  function handleSessionMutated() {
    // SessionScreen already calls saveActiveSession(null) before this fires
    setSavedSessionData(null);
    setActiveSession(null);
    setHistorySession(null);
    setSessionDateOverride(null);
    setSessionLogVersion((version) => version + 1);
  }

  const liveColour = savedSessionData ? (sessionForIndex(savedSessionData.sessionIndex)?.colour || null) : null;
  const [menuOpen, setMenuOpen] = useState(false);

  function selectTab(id) {
    setActiveTab(id);
    setMenuOpen(false);
  }

  return (
    <div
      style={{
        background: 'var(--bg)',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font)',
        position: 'relative',
      }}
    >
      {/* Full-screen session overlay */}
      {activeSession && (
        <SessionScreen
          session={activeSession}
          sessionIndex={activeSessionIndex}
          onBack={closeSessionOverlay}
          onComplete={handleSessionMutated}
          onDelete={handleSessionMutated}
          historySession={historySession}
          targetDateStr={sessionDateOverride}
        />
      )}

      {/* Scrollable content area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {activeTab === 'home' && (
          <Dashboard
            key={`home-${sessionLogVersion}`}
            onStartSession={handleStartSession}
            onViewSession={handleViewSession}
            savedSession={savedSessionData}
            onContinueSession={handleContinueSession}
          />
        )}
        {activeTab === 'prbook' && <PRBook />}
        {activeTab === 'programme' && <Programme />}
        {activeTab === 'calendar' && (
          <Calendar
            key={`calendar-${sessionLogVersion}`}
            onViewSession={handleViewSession}
            onCreateSession={handleCreateSession}
          />
        )}
        {activeTab === 'settings' && <Settings />}
      </div>

      {/* Hamburger button — top right */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        className="btn btn-outline btn-icon"
        style={{
          position: 'fixed',
          top: 'calc(16px + env(safe-area-inset-top, 0px))',
          right: 16,
          zIndex: 95,
          background: menuOpen ? 'var(--muted)' : 'rgba(9, 9, 11, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <svg {...ICON} width={18} height={18}>
          {menuOpen
            ? <path d="M18 6 6 18M6 6l12 12" />
            : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
        {/* Live session indicator */}
        {liveColour && !menuOpen && (
          <span style={{
            position: 'absolute', top: -3, right: -3,
            width: 9, height: 9, borderRadius: '50%',
            background: liveColour,
            boxShadow: `0 0 6px ${liveColour}`,
            border: '2px solid var(--bg)',
          }} />
        )}
      </button>

      {/* Menu overlay */}
      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 90,
            }}
          />
          <nav
            style={{
              position: 'fixed',
              top: 'calc(60px + env(safe-area-inset-top, 0px))',
              right: 16,
              minWidth: 200,
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 4,
              zIndex: 94,
              boxShadow: 'var(--shadow-md)',
              animation: 'menuIn 0.15s ease-out',
              transformOrigin: 'top right',
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className="menu-item"
                  data-active={isActive}
                  onClick={() => selectTab(tab.id)}
                >
                  <span style={{ display: 'flex', color: isActive ? 'var(--fg)' : 'var(--fg-subtle)' }}>{tab.icon}</span>
                  <span style={{ flex: 1 }}>{tab.label}</span>
                  {tab.id === 'home' && liveColour && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: liveColour,
                      boxShadow: `0 0 5px ${liveColour}`,
                    }} />
                  )}
                </button>
              );
            })}
          </nav>
        </>
      )}
    </div>
  );
}
