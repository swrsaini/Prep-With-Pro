import React, { createContext, useContext, useEffect, useState } from 'react';

const PomodoroContext = createContext(null);
const durations = { Focus: 25 * 60, 'Short Break': 5 * 60, 'Long Break': 15 * 60 };

function PomodoroProvider({ children }) {
  const [state, setState] = useState({ phase: 'Focus', seconds: durations.Focus, running: false });

  useEffect(() => {
    if (!state.running) return undefined;
    const timer = window.setInterval(() => setState((current) => {
      if (current.seconds > 1) return { ...current, seconds: current.seconds - 1 };
      const nextPhase = current.phase === 'Focus' ? 'Short Break' : 'Focus';
      return { phase: nextPhase, seconds: durations[nextPhase], running: false };
    }), 1000);
    return () => window.clearInterval(timer);
  }, [state.running]);

  function toggle() { setState((current) => ({ ...current, running: !current.running })); }
  function reset() { setState((current) => ({ ...current, seconds: durations[current.phase], running: false })); }
  function setPhase(phase) { setState({ phase, seconds: durations[phase], running: false }); }
  const minutes = Math.floor(state.seconds / 60);
  const seconds = state.seconds % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return <PomodoroContext.Provider value={{ ...state, display, toggle, reset, setPhase }}>{children}</PomodoroContext.Provider>;
}

function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) throw new Error('usePomodoro must be used inside a PomodoroProvider.');
  return context;
}

export { PomodoroProvider, usePomodoro };
