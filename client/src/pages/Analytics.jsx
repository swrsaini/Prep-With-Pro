import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';

function dayKey(date) { const value = new Date(date); return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`; }
function Analytics() {
  const { questions, progress, loading, error } = useApp();
  const attempts = progress.attempts || [];
  const activeDays = new Set(attempts.filter((attempt) => attempt.timestamp).map((attempt) => dayKey(attempt.timestamp))).size;
  const cleared = questions.length ? Math.round((new Set(attempts.map((attempt) => String(attempt.question?._id || attempt.question || attempt.questionId))).size / questions.length) * 100) : 0;
  const points = progress.xp || 0;
  const chartData = useMemo(() => { let cumulative = 0; return [...attempts].sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)).map((attempt, index) => ({ index, cumulative: ++cumulative, correct: attempt.correct })); }, [attempts]);
  const visible = chartData.slice(-10);
  const pointsString = visible.length ? visible.map((point, index) => `${10 + (index * (220 / Math.max(visible.length - 1, 1)))},${130 - ((point.cumulative / Math.max(visible[visible.length - 1].cumulative, 1)) * 100)}`).join(' ') : '';
  if (loading) return <PageState text="Loading analytics..." />;
  if (error) return <PageState text={error} error />;
  return <section className="view-pane active directory-page" id="stats-pane"><h3 className="directory-title">Live Analytical Reporting</h3><p className="directory-intro">Granular analytics derived from active data stores and question practices.</p><div className="split-layout analytics-layout"><div className="glass-card analytics-chart-card"><h3>Cumulative Question Solving History</h3>{visible.length ? <svg className="analytics-line-chart" viewBox="0 0 240 150" role="img" aria-label="Cumulative question solving history"><line x1="10" y1="130" x2="230" y2="130" stroke="var(--border-color)" strokeDasharray="2 2" /><polyline fill="none" stroke="url(#analytics-gradient)" strokeWidth="4" strokeLinecap="round" points={pointsString} />{visible.map((point, index) => <circle key={point.index} cx={10 + (index * (220 / Math.max(visible.length - 1, 1)))} cy={130 - ((point.cumulative / Math.max(visible[visible.length - 1].cumulative, 1)) * 100)} r="3" fill={point.correct ? 'var(--success)' : 'var(--danger)'} />)}<defs><linearGradient id="analytics-gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="var(--primary)" /><stop offset="100%" stopColor="var(--accent)" /></linearGradient></defs></svg> : <p className="analytics-empty">Solve questions to populate graphs.</p>}</div><div className="glass-card analytics-stats-card"><h3>Data Sync Stats</h3><div className="setting-row"><span>Syllabus Cleared</span><strong>{cleared}%</strong></div><div className="setting-row"><span>Total System Points</span><strong>{points} PTS</strong></div><div className="setting-row"><span>Active Practice Days</span><strong>{activeDays} Days</strong></div></div></div></section>;
}
function PageState({ text, error = false }) { return <section className="view-pane active"><div className={`glass-card ${error ? 'form-error' : ''}`}>{text}</div></section>; }
export default Analytics;
