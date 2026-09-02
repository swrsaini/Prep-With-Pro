import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ContentRenderer } from '../utils/contentRenderer';
import { inferDifficulty, isPracticeQuestion } from '../utils/difficulty';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function questionId(question) {
  return question?._id || question?.id || question?.legacy_id;
}

function optionsFor(question) {
  if (Array.isArray(question?.options)) return Object.fromEntries(question.options.map((value, index) => [String(index + 1), value]));
  return question?.options || {};
}

function correctKey(question) {
  const options = optionsFor(question);
  const answer = String(question?.correct_answer || '').trim();
  if (options[answer] !== undefined) return answer;
  const marker = answer.match(/^Option\s+([A-Za-z0-9]+)/i) || answer.match(/^\(?([A-Za-z0-9]+)\)?[.):]/);
  if (marker) {
    const value = marker[1];
    const numeric = /^\d+$/.test(value) ? value : String(value.toUpperCase().charCodeAt(0) - 64);
    if (options[value] !== undefined) return value;
    if (options[numeric] !== undefined) return numeric;
    if (options[value.toUpperCase()] !== undefined) return value.toUpperCase();
  }
  const answerText = answer.replace(/^\(?[A-Za-z0-9]+\)?[.):]\s*/, '').toLowerCase();
  return Object.entries(options).find(([, value]) => String(value).trim().toLowerCase() === answer.toLowerCase() || String(value).trim().toLowerCase() === answerText)?.[0] || Object.keys(options)[0];
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function formatCountdown(seconds) {
  return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

async function submitResult(token, questions, answers, negativeMarking, timeTaken) {
  const response = await fetch(`${API_URL}/api/progress/mock-result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ questions: questions.map(questionId), answers, negativeMarking, timeTaken }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Unable to submit mock test.');
  return data;
}

function MockExam() {
  const { token } = useAuth();
  const { questions, loading, error: dataError } = useApp();
  const [mode, setMode] = useState('setup');
  const [setup, setSetup] = useState({ count: '10', category: 'all', negativeMarking: '0.25', timer: '60', shuffle: 'true', source: 'all' });
  const [examQuestions, setExamQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [review, setReview] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [palettePage, setPalettePage] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = useMemo(() => [...new Set(questions.map((question) => question.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [questions]);
  const currentQuestion = examQuestions[currentIndex];
  const sourceCounts = useMemo(() => ({
    practice: questions.filter(isPracticeQuestion).length,
    pyq: questions.filter((question) => !isPracticeQuestion(question)).length,
    custom: questions.filter((question) => question.custom_added).length,
  }), [questions]);

  useEffect(() => {
    if (mode !== 'live' || !timeLeft) return undefined;
    const timer = window.setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [mode, timeLeft]);

  useEffect(() => {
    if (mode === 'live' && timeLeft === 0 && setup.timer !== '0' && examQuestions.length && !submitting) finishExam();
  }, [timeLeft, mode]);

  function updateSetup(event) {
    setSetup((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function launchExam(event) {
    event.preventDefault();
    let pool = questions;
    if (setup.category !== 'all') pool = pool.filter((question) => question.category === setup.category);
    if (setup.source === 'practice') pool = pool.filter(isPracticeQuestion);
    if (setup.source === 'pyq') pool = pool.filter((question) => !isPracticeQuestion(question));
    if (setup.source === 'custom') pool = pool.filter((question) => question.custom_added);
    const selected = setup.shuffle === 'true' ? shuffle(pool) : [...pool];
    const count = setup.count === 'all' ? selected.length : Number(setup.count);
    const generated = selected.slice(0, count);
    if (!generated.length) {
      setSubmitError('No questions found for these settings. Try a different category or source.');
      return;
    }
    setSubmitError('');
    setExamQuestions(generated);
    setAnswers({});
    setReview([]);
    setCurrentIndex(0);
    setPalettePage(0);
    setResult(null);
    setStartedAt(Date.now());
    setTimeLeft(setup.timer === '0' ? 0 : generated.length * Number(setup.timer));
    setMode('live');
  }

  function chooseQuestion(index) {
    setCurrentIndex(index);
    setPalettePage(Math.floor(index / 30));
  }

  function toggleReview() {
    setReview((current) => current.includes(currentIndex) ? current.filter((index) => index !== currentIndex) : [...current, currentIndex]);
  }

  function clearAnswer() {
    setAnswers((current) => {
      const updated = { ...current };
      delete updated[currentIndex];
      return updated;
    });
  }

  async function finishExam() {
    if (submitting || !examQuestions.length) return;
    setSubmitting(true);
    setSubmitError('');
    if (mode === 'live') setMode('results');
    try {
      const completed = await submitResult(token, examQuestions, answers, Number(setup.negativeMarking), Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
      setResult(completed);
    } catch (submitRequestError) {
      setSubmitError(submitRequestError.message);
      setMode('live');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <section className="view-pane active"><div className="glass-card"><p>Loading questions...</p></div></section>;
  if (dataError) return <section className="view-pane active"><div className="glass-card"><p className="form-error">{dataError}</p></div></section>;

  return <section className="view-pane active mock-page" id="mock-pane">
    {mode === 'setup' && <SetupView setup={setup} categories={categories} sourceCounts={sourceCounts} error={submitError} onChange={updateSetup} onSubmit={launchExam} />}
    {mode === 'live' && currentQuestion && <LiveView questions={examQuestions} currentIndex={currentIndex} currentQuestion={currentQuestion} answers={answers} review={review} timeLeft={timeLeft} unlimited={setup.timer === '0'} palettePage={palettePage} error={submitError} onChoose={chooseQuestion} onAnswer={(key) => setAnswers((current) => ({ ...current, [currentIndex]: key }))} onClear={clearAnswer} onReview={toggleReview} onFinish={finishExam} onPage={setPalettePage} />}
    {mode === 'results' && result && <ResultsView result={result} questions={examQuestions} answers={answers} negativeMarking={Number(setup.negativeMarking)} onAgain={() => { setMode('setup'); setSubmitError(''); }} />}
    {mode === 'results' && !result && submitting && <div className="glass-card mock-submitting"><p>Calculating your results...</p></div>}
  </section>;
}

function SetupView({ setup, categories, sourceCounts, error, onChange, onSubmit }) {
  return <div className="glass-card mock-setup-card"><h3 className="mock-title">🛡️ Premium Mock Exam Generator</h3><p className="mock-subtitle">Setup customizable test rules to mimic actual DSSSB exams with negative marking options.</p><form onSubmit={onSubmit}><div className="mock-setup-grid">
    <SetupField label="Number of Questions"><select className="select-filter" name="count" value={setup.count} onChange={onChange}><option value="10">10 Questions</option><option value="25">25 Questions</option><option value="50">50 Questions</option><option value="100">100 Questions</option><option value="all">Full Bank</option></select></SetupField>
    <SetupField label="Category Focus"><select className="select-filter" name="category" value={setup.category} onChange={onChange}><option value="all">All Topics (Mixed)</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></SetupField>
    <SetupField label="Negative Marking"><select className="select-filter" name="negativeMarking" value={setup.negativeMarking} onChange={onChange}><option value="0">No Penalties</option><option value="0.25">-0.25 point</option><option value="0.33">-0.33 point</option><option value="0.5">-0.5 point</option><option value="1">-1 point</option></select></SetupField>
    <SetupField label="Time Limit per Question"><select className="select-filter" name="timer" value={setup.timer} onChange={onChange}><option value="60">1 Minute / Question</option><option value="45">45 Seconds / Question</option><option value="90">1.5 Minutes / Question</option><option value="0">No Limits</option></select></SetupField>
    <SetupField label="Shuffle Rules"><select className="select-filter" name="shuffle" value={setup.shuffle} onChange={onChange}><option value="true">Shuffle Questions</option><option value="false">Chronological Order</option></select></SetupField>
    <SetupField label="Question Source"><select className="select-filter" name="source" value={setup.source} onChange={onChange}><option value="all">All Sources</option><option value="practice">Practice Questions Only</option><option value="pyq">PYQs Only</option><option value="custom">My Uploaded Questions Only</option></select><small className="setup-hint">{setup.source === 'all' ? `${sourceCounts.practice + sourceCounts.pyq} total questions available.` : `${sourceCounts[setup.source] || 0} questions available.`}</small></SetupField>
  </div>{error && <p className="form-error">{error}</p>}<button className="btn btn-primary mock-launch" type="submit">🚀 Generate &amp; Launch Live Mock Test</button></form></div>;
}

function SetupField({ label, children }) { return <div className="setup-card"><label>{label}</label>{children}</div>; }

function LiveView({ questions, currentIndex, currentQuestion, answers, review, timeLeft, unlimited, palettePage, error, onChoose, onAnswer, onClear, onReview, onFinish, onPage }) {
  const options = optionsFor(currentQuestion);
  const pageQuestions = questions.slice(palettePage * 30, palettePage * 30 + 30);
  const pages = Math.max(1, Math.ceil(questions.length / 30));
  return <div className="mock-live-view"><div className="split-layout"><div className="glass-card mock-question-card"><div className="portal-header"><div><span className="mock-active-label">MOCK TEST ACTIVE</span><h3>Question {currentIndex + 1} of {questions.length}</h3></div><div className="mock-countdown"><span>Remaining Time</span><strong>{unlimited ? 'INFINITY' : formatCountdown(timeLeft)}</strong></div></div><div className="progress-bar-container"><div className="progress-bar-fill" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} /></div><div className="question-card-wrapper"><div className="question-meta-tags"><span className="meta-tag category">{currentQuestion.category}</span><span className="meta-tag difficulty">{inferDifficulty(currentQuestion)}</span><span className="meta-tag exam-info">Marks: 1.0</span><span className="meta-tag exam-info">Penalties: -{Number(currentQuestion.negativeMarking || 0)}</span></div><div className="question-text"><ContentRenderer text={currentQuestion.question} /></div><div className="options-list">{Object.entries(options).map(([key, value]) => <button className={`question-option-card ${answers[currentIndex] === key ? 'selected' : ''}`} type="button" key={key} onClick={() => onAnswer(key)}><span className="option-indicator">{key}</span><span><ContentRenderer text={value} /></span></button>)}</div></div>{error && <p className="form-error">{error}</p>}<div className="action-bar mock-action-bar"><button className="btn btn-secondary" type="button" disabled={currentIndex === 0} onClick={() => onChoose(currentIndex - 1)}>Previous</button><div className="btn-group"><button className="btn btn-secondary" type="button" onClick={onClear}>Clear Answer</button><button className="btn btn-accent" type="button" onClick={onReview}>{review.includes(currentIndex) ? 'Clear Review Tag' : 'Review Later'}</button><button className="btn btn-success" type="button" onClick={onFinish}>Submit Entire Test</button></div><button className="btn btn-primary" type="button" disabled={currentIndex === questions.length - 1} onClick={() => onChoose(currentIndex + 1)}>Next</button></div></div><Palette questions={pageQuestions} currentIndex={currentIndex} pageStart={palettePage * 30} answers={answers} review={review} pages={pages} page={palettePage} onChoose={onChoose} onPage={onPage} /></div></div>;
}

function Palette({ questions, currentIndex, pageStart, answers, review, pages, page, onChoose, onPage }) { return <div className="glass-card mock-palette"><div className="palette-title">Mock Question Navigator</div><div className="palette-grid">{questions.map((question, index) => { const actual = pageStart + index; return <button className={`palette-btn ${review.includes(actual) ? 'review' : answers[actual] !== undefined ? 'correct' : 'unvisited'} ${actual === currentIndex ? 'active-q' : ''}`} type="button" key={questionId(question)} onClick={() => onChoose(actual)}>{actual + 1}</button>; })}</div><div className="palette-pagination"><button className="palette-page-btn" type="button" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</button><span className="palette-page-indicator">Page {page + 1} of {pages}</span><button className="palette-page-btn" type="button" disabled={page === pages - 1} onClick={() => onPage(page + 1)}>Next</button></div><div className="palette-legend"><div className="legend-item"><div className="legend-color" />Unvisited</div><div className="legend-item"><div className="legend-color" style={{ background: 'var(--success-light)', borderColor: 'var(--success)' }} />Answered</div><div className="legend-item"><div className="legend-color" style={{ background: 'var(--warning-light)', borderColor: 'var(--warning)' }} />Review</div></div></div>; }

function ResultsView({ result, questions, answers, negativeMarking, onAgain }) {
  const failures = new Map();
  questions.forEach((question, index) => { if (answers[index] && answers[index] !== correctKey(question)) failures.set(question.category, (failures.get(question.category) || 0) + 1); });
  const recommendations = [...failures].sort((a, b) => b[1] - a[1]).slice(0, 2);
  const total = result.correct + result.incorrect + result.skipped;
  const correctDash = total ? (result.correct / total) * 251.2 : 0;
  const incorrectDash = total ? (result.incorrect / total) * 251.2 : 0;
  return <div className="mock-results"><div className="glass-card mock-result-hero"><h2>Mock Test Results</h2><p>Check below for a complete performance summary</p><div className="result-score-grid"><div><span>Total Score</span><strong>{Number(result.score).toFixed(2)} / {questions.length}</strong></div><div><span>Accuracy</span><strong>{result.accuracy}%</strong></div></div></div><div className="split-layout"><div className="mock-result-main"><div className="glass-card"><h3 className="mock-section-title">Performance Matrix</h3><div className="dashboard-grid"><ResultMetric value={result.correct} label="Correct" tone="success" /><ResultMetric value={result.incorrect} label="Incorrect" tone="danger" /><ResultMetric value={result.skipped} label="Skipped" tone="warning" /><ResultMetric value={`${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`} label="Time Spent" tone="info" /></div></div><div className="glass-card"><h3 className="mock-section-title">🎓 Personalized Recommendations</h3>{recommendations.length ? recommendations.map(([category, count]) => <div className="recommendation-item" key={category}><strong>Review {category}</strong><span>You missed {count} question profile set{count > 1 ? 's' : ''} in this segment.</span></div>) : <div className="recommendation-item recommendation-good"><strong>Flawless Execution Checklist!</strong><span>Keep up the high standards!</span></div>}</div></div><div className="mock-result-side"><div className="glass-card mock-chart-card"><h3 className="mock-section-title">Correct vs Incorrect Ratio</h3><svg className="mock-pie-chart" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border-color)" strokeWidth="20" /><circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--success)" strokeWidth="20" strokeDasharray={`${correctDash} 251.2`} transform="rotate(-90 50 50)" /><circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--danger)" strokeWidth="20" strokeDasharray={`${incorrectDash} 251.2`} strokeDashoffset={-correctDash} transform="rotate(-90 50 50)" /></svg><div className="chart-legend">● Correct &nbsp; ● Error &nbsp; ○ Skip</div></div><div className="glass-card"><button className="btn btn-primary full-button" type="button" onClick={() => window.print()}>🖨️ Print Exam Report</button><button className="btn btn-secondary full-button" type="button" onClick={onAgain}>🔄 Take Another Mock Test</button></div></div></div><div className="glass-card mock-review-list"><h3 className="mock-section-title">📋 Comprehensive Question Review</h3>{questions.map((question, index) => <ReviewQuestion question={question} answer={answers[index]} key={questionId(question)} />)}</div></div>;
}

function ResultMetric({ value, label, tone }) { return <div className={`glass-card metric-card ${tone}`}><div className="metric-icon">{tone === 'success' ? '✔️' : tone === 'danger' ? '❌' : tone === 'warning' ? '⏭️' : '⏱️'}</div><div className="metric-info"><span className="metric-value">{value}</span><span className="metric-label">{label}</span></div></div>; }

function ReviewQuestion({ question, answer }) { const correct = correctKey(question); const status = answer === undefined ? 'SKIPPED' : answer === correct ? 'CORRECT' : 'INCORRECT'; return <article className={`mock-review-question ${status.toLowerCase()}`}><div className="review-heading"><strong>Question {question.question_number || ''}</strong><span>{status}</span></div><div className="review-question-text"><ContentRenderer text={question.question} /></div><p><strong>Your answer:</strong> {answer === undefined ? 'Skipped' : `${answer}. ${optionsFor(question)[answer] || ''}`}</p><p><strong>Correct answer:</strong> {correct}. {optionsFor(question)[correct] || ''}</p><div className="review-explanations"><div><strong>Explanation</strong><ContentRenderer text={question.correct_explanation || question.answer_explanation || ''} /></div><div><strong>Why other options are incorrect</strong><ContentRenderer text={question.incorrect_explanation || ''} /></div></div></article>; }

export default MockExam;
