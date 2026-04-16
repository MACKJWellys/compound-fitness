import { useState } from 'react';
import Dashboard from './screens/Dashboard';
import PRBook from './screens/PRBook';
import Programme from './screens/Programme';
import SessionScreen from './screens/SessionScreen';
import Calendar from './screens/Calendar';
import Settings from './screens/Settings';
import { DAYS } from './data/programme';
import { getActiveSession, saveActiveSession } from './data/storage';

const TABS = [
  {
    id: 'home',
    label: 'HOME',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
          stroke={active ? '#e8e8e8' : '#555'}
          strokeWidth="1.5"
          fill={active ? '#e8e8e822' : 'none'}
          strokeLinejoin="round"
        />
        <rect x="7.5" y="12" width="5" height="6" rx="0.5" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'prbook',
    label: 'PR BOOK',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect
          x="4"
          y="2"
          width="12"
          height="16"
          rx="1.5"
          stroke={active ? '#e8e8e8' : '#555'}
          strokeWidth="1.5"
        />
        <line x1="7" y1="7" x2="13" y2="7" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="10" x2="13" y2="10" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="13" x2="11" y2="13" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'programme',
    label: 'PROGRAMME',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect
          x="3"
          y="5"
          width="14"
          height="12"
          rx="1.5"
          stroke={active ? '#e8e8e8' : '#555'}
          strokeWidth="1.5"
        />
        <line x1="3" y1="9" x2="17" y2="9" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" />
        <line x1="7" y1="3" x2="7" y2="7" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="3" x2="13" y2="7" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'calendar',
    label: 'CAL',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="14" height="13" rx="1.5" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" />
        <line x1="3" y1="8" x2="17" y2="8" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" />
        <line x1="7" y1="2" x2="7" y2="6" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="2" x2="13" y2="6" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="7" cy="12" r="1" fill={active ? '#e8e8e8' : '#555'} />
        <circle cx="10" cy="12" r="1" fill={active ? '#e8e8e8' : '#555'} />
        <circle cx="13" cy="12" r="1" fill={active ? '#e8e8e8' : '#555'} />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'DATA',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 6h12M4 10h12M4 14h8" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="15" cy="14" r="2" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" />
      </svg>
    ),
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeSession, setActiveSession] = useState(() => {
    const saved = getActiveSession();
    return saved ? (DAYS[saved.sessionIndex] || null) : null;
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
    const idx = DAYS.findIndex((d) => d.name === session.name);
    setActiveSessionIndex(idx >= 0 ? idx : 0);
    setActiveSession(session);
    setHistorySession(null);
    setSessionDateOverride(null);
  }

  function handleContinueSession() {
    const saved = getActiveSession();
    if (!saved) return;
    const dayDef = DAYS[saved.sessionIndex];
    if (!dayDef) return;
    setActiveSessionIndex(saved.sessionIndex);
    setActiveSession(dayDef);
    setHistorySession(null);
    setSessionDateOverride(null);
  }

  function handleViewSession(logEntry) {
    const dayDef = DAYS.find((d) => d.name === logEntry.sessionName) || DAYS[0];
    const idx = DAYS.indexOf(dayDef);
    setActiveSessionIndex(idx >= 0 ? idx : 0);
    setActiveSession(dayDef);
    setHistorySession(logEntry);
    setSessionDateOverride(null);
  }

  function handleCreateSession(dateStr, sessionName) {
    const dayDef = DAYS.find((d) => d.name === sessionName);
    if (!dayDef) return;
    const idx = DAYS.indexOf(dayDef);
    setActiveSessionIndex(idx >= 0 ? idx : 0);
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

  const liveColour = savedSessionData ? (DAYS[savedSessionData.sessionIndex]?.colour || null) : null;

  return (
    <div
      style={{
        background: '#111111',
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
          // Reserve space for the tab bar (~60px) + safe area
          paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
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

      {/* Bottom tab bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
          background: '#1a1a1a',
          borderTop: '1px solid #2a2a2a',
          display: 'flex',
          alignItems: 'flex-start',
          zIndex: 50,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                height: 60,
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                cursor: 'pointer',
                color: isActive ? '#e8e8e8' : '#555',
                padding: 0,
                transition: 'color 0.15s ease',
                position: 'relative',
              }}
            >
              {/* Live session indicator — HOME tab only */}
              {tab.id === 'home' && liveColour && (
                <>
                  <div style={{
                    position: 'absolute', top: 0, left: '20%', right: '20%',
                    height: 2, background: liveColour,
                    borderRadius: '0 0 2px 2px',
                    boxShadow: `0 0 6px ${liveColour}`,
                  }} />
                  <div style={{
                    position: 'absolute', top: 6, right: 10,
                    width: 5, height: 5, borderRadius: '50%',
                    background: liveColour,
                    boxShadow: `0 0 5px ${liveColour}`,
                  }} />
                </>
              )}
              {tab.icon(isActive)}
              <span
                style={{
                  fontSize: 9,
                  fontFamily: 'var(--font)',
                  fontWeight: isActive ? 700 : 400,
                  letterSpacing: '0.08em',
                  color: isActive ? '#e8e8e8' : '#555',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
