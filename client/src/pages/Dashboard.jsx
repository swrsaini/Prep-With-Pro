import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const quotes = [
  'Preparation is the key to success. Believe in yourself and keep pushing forward.',
  'Small progress is still progress. Keep showing up.',
  'The work you do today makes tomorrow easier.',
];

const badgeTypes = [
  { title: 'Initiate', icon: '🐣', description: 'Complete 1st Question' },
  { title: 'Champion', icon: '🏆', description: 'Get 10 answers correct' },
  { title: 'Streak Pro', icon: '🔥', description: 'Maintain 3 day streak' },
  { title: 'Century', icon: '💯', description: 'Solve 100 Questions' },
];

function questionKey(question) {
  return String(question._id || question.id || question.legacy_id);
}

function attemptQuestionKey(attempt) {
  return String(attempt.question?._id || attempt.question || attempt.questionId);
}

function calendarDay(date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

function sameCalendarDay(firstDate, secondDate) {
  return calendarDay(firstDate).getTime() === calendarDay(secondDate).getTime();
}

function Dashboard() {
  const navigate = useNavigate();
  const { questions, progress, loading, error } = useApp();
  const attempts = progress.attempts || [];
  const attemptedKeys = new Set(attempts.map(attemptQuestionKey));
  const correctCount = attempts.filter((attempt) => attempt.correct).length;
  const incorrectCount = attempts.length - correctCount;
  const accuracy = attempts.length ? Math.round((correctCount / attempts.length) * 100) : 0;
  const today = new Date();
  const todayAttempts = attempts.filter((attempt) => attempt.timestamp && sameCalendarDay(attempt.timestamp, today)).length;
  const dailyGoalPercent = Math.min(100, Math.round((todayAttempts / 15) * 100));
  const mastery = questions.length ? Math.round((attemptedKeys.size / questions.length) * 100) : 0;
  const qotd = questions.length ? questions[today.getDate() % questions.length] : null;
  const quote = quotes[today.getDate() % quotes.length];

  const attemptsByQuestion = new Map(attempts.map((attempt) => [attemptQuestionKey(attempt), attempt]));
  const categoryData = new Map();
  questions.forEach((question) => {
    const attempt = attemptsByQuestion.get(questionKey(question));
    if (!attempt) return;
    const category = question.category || 'Uncategorized';
    const current = categoryData.get(category) || { correct: 0, total: 0 };
    current.total += 1;
    if (attempt.correct) current.correct += 1;
    categoryData.set(category, current);
  });

  const categoryReports = Array.from(categoryData, ([name, data]) => ({
    name,
    accuracy: Math.round((data.correct / data.total) * 100),
  }));
  const strongCategories = categoryReports.filter((category) => category.accuracy >= 60).sort((a, b) => b.accuracy - a.accuracy).slice(0, 3);
  const weakCategories = categoryReports.filter((category) => category.accuracy < 60).sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);

  const heatmap = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    const count = attempts.filter((attempt) => attempt.timestamp && sameCalendarDay(attempt.timestamp, date)).length;
    const intensity = count === 0 ? '0' : count <= 3 ? 'low' : count <= 8 ? 'med' : 'high';
    return { date, count, intensity };
  });

  const circumference = 2 * Math.PI * 35;
  const dashOffset = circumference - (mastery / 100) * circumference;

  if (loading) return <section className="view-pane active"><div className="glass-card"><p>Loading your dashboard...</p></div></section>;
  if (error) return <section className="view-pane active"><div className="glass-card"><p className="form-error">{error}</p></div></section>;

  return (
    <section className="view-pane active" id="dashboard-pane">
      <div className="playlist-callout">
        <div className="playlist-callout-media"><iframe src="https://www.youtube.com/embed/videoseries?si=-Y_pH04ZSgyViU__&amp;list=PLaYWPqgF1OCc" title="DSSSB TGT Computer Science Free Batch Playlist" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" /></div>
        <div className="playlist-callout-body"><div className="playlist-callout-eyebrow">Free Video Batch</div><h3 className="playlist-callout-title">DSSSB TGT Computer Science Free Batch Playlist</h3><p className="playlist-callout-sub">Full lecture series on YouTube to pair with your practice sessions.</p><a href="https://www.youtube.com/playlist?list=PLaYWPqgF1OCc" target="_blank" rel="noopener noreferrer" className="playlist-callout-cta">Open Full Playlist &gt;</a></div>
      </div>

      <div className="dash-resource-bar">
        <a href="https://www.youtube.com/@PrepWithPro" target="_blank" rel="noopener noreferrer" className="dash-resource-chip"><span aria-hidden="true">▶</span> Subscribe on YouTube</a>
        <a href="https://t.me/prepwithprochat" target="_blank" rel="noopener noreferrer" className="dash-resource-chip"><span aria-hidden="true">➤</span> Join Telegram Channel</a>
      </div>

      <div className="dashboard-grid">
        <MetricCard value={questions.length.toLocaleString()} label="Total Questions" icon="📚" />
        <MetricCard value={attempts.length} label="Attempted" icon="✏️" tone="accent" />
        <MetricCard value={correctCount} label="Correct Answers" icon="✔️" tone="success" />
        <MetricCard value={incorrectCount} label="Incorrect Answers" icon="❌" tone="danger" />
        <MetricCard value={`${accuracy}%`} label="Accuracy Rate" icon="🎯" tone="warning" />
        <MetricCard value={`${progress.streak || 0} days`} label="Active Streak" icon="🔥" tone="info" />
      </div>

      <div className="split-layout">
        <div className="dashboard-detail-column">
          <div className="glass-card qotd-card">
            <h3>💡 Question of the Day</h3>
            <p className="qotd-category">{qotd ? `${qotd.category} • DSSSB Core Prep` : 'Your question bank will appear here'}</p>
            <div className="qotd-text">{qotd?.question || 'Load questions to begin your daily practice.'}</div>
            <button className="btn btn-secondary qotd-button" type="button" disabled={!qotd} onClick={() => navigate('/practice', { state: { questionId: qotd?._id || qotd?.id || qotd?.legacy_id } })}>Practice Now</button>
          </div>

          <div className="glass-card">
            <h3 className="dashboard-card-title">📅 Daily Goal Tracker</h3>
            <div className="daily-goal-row"><span>Solve 15 Questions</span><span>{Math.min(todayAttempts, 15)}/15</span></div>
            <div className="progress-bar-container daily-goal-progress"><div className="progress-bar-fill" style={{ width: `${dailyGoalPercent}%` }} /></div>
            <p className="dashboard-muted">🌟 Complete daily goal to earn <strong>+50 Bonus XP</strong>!</p>
          </div>

          <div className="glass-card quote-card"><p>&quot;{quote}&quot;</p></div>

          <div className="settings-grid">
            <CategoryPanel title="⭐ Strong Categories" categories={strongCategories} empty="No data. Solve questions to identify." tone="strong" />
            <CategoryPanel title="⚠️ Weak Categories" categories={weakCategories} empty="No data. Solve questions to identify." tone="weak" />
          </div>
        </div>

        <div className="dashboard-widget-column">
          <div className="glass-card mastery-card">
            <h3 className="dashboard-card-title">Mastery Index</h3>
            <svg className="mastery-donut" viewBox="0 0 100 100" aria-label={`${mastery}% syllabus mastered`}>
              <circle cx="50" cy="50" r="35" stroke="var(--border-color)" strokeWidth="8" fill="transparent" />
              <circle cx="50" cy="50" r="35" stroke="url(#mastery-gradient)" strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeWidth="8" strokeLinecap="round" fill="transparent" />
              <defs><linearGradient id="mastery-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="var(--primary)" /><stop offset="100%" stopColor="var(--accent)" /></linearGradient></defs>
              <text x="50" y="55" textAnchor="middle" fontWeight="800" fontSize="16" fill="var(--text-primary)">{mastery}%</text>
            </svg>
            <p className="dashboard-muted">{mastery}% complete mastery</p>
          </div>

          <div className="glass-card"><h3 className="dashboard-card-title">Achievements</h3><div className="badge-list">{badgeTypes.map((badge) => <div className={`badge-item ${((badge.title === 'Initiate' && attempts.length >= 1) || (badge.title === 'Champion' && correctCount >= 10) || (badge.title === 'Streak Pro' && progress.streak >= 3) || (badge.title === 'Century' && attempts.length >= 100)) ? 'unlocked' : ''}`} key={badge.title}><div className="badge-icon-holder" title={badge.description}>{badge.icon}</div><span>{badge.title}</span></div>)}</div></div>

          <div className="glass-card"><h3 className="dashboard-card-title">Activity Heatmap</h3><p className="dashboard-muted">Daily practices recorded over the last month</p><div className="heatmap-grid">{heatmap.map(({ date, count, intensity }) => <div className="heatmap-cell" data-count={intensity} key={date.toISOString()}><div className="heatmap-tooltip">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {count} solves</div></div>)}</div></div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ value, label, icon, tone = '' }) {
  return <div className={`glass-card metric-card ${tone}`}><div className="metric-icon">{icon}</div><div className="metric-info"><span className="metric-value">{value}</span><span className="metric-label">{label}</span></div></div>;
}

function CategoryPanel({ title, categories, empty, tone }) {
  return <div className="glass-card"><h3 className={`dashboard-card-title ${tone}`}>{title}</h3><ul className="category-report-list">{categories.length ? categories.map((category) => <li key={category.name}><span>📘 {category.name}</span><strong>{category.accuracy}% accuracy</strong></li>) : <li className="dashboard-muted">{empty}</li>}</ul></div>;
}

export default Dashboard;
