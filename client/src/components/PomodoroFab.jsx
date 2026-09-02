import React, { useState } from 'react';
import { usePomodoro } from '../context/PomodoroContext';
import { useToast } from '../context/ToastContext';

function PomodoroFab() {
  const { phase, display, running, toggle, reset, setPhase } = usePomodoro();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  function handleToggle() { toggle(); showToast(running ? 'Study timer paused.' : 'Focus session initialized!'); }
  return <>
    <button className="fab pomo-fab-trigger" type="button" title="Launch Pomodoro Focus Mode" aria-label="Open Pomodoro timer" onClick={() => setOpen((value) => !value)}>⏱️</button>
    <div className={`pomo-fab-panel${open ? ' open' : ''}`}><div className="pomo-fab-display"><span>{phase}</span><strong>{display}</strong></div><div className="pomo-fab-actions"><button type="button" onClick={handleToggle}>{running ? 'Pause' : 'Start'}</button><button type="button" onClick={reset}>Reset</button></div><div className="pomo-phase-actions"><button type="button" className={phase === 'Focus' ? 'active' : ''} onClick={() => setPhase('Focus')}>Focus</button><button type="button" className={phase === 'Short Break' ? 'active' : ''} onClick={() => setPhase('Short Break')}>Short break</button><button type="button" className={phase === 'Long Break' ? 'active' : ''} onClick={() => setPhase('Long Break')}>Long break</button></div></div>
  </>;
}

export default PomodoroFab;
