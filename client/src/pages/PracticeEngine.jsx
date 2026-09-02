import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ContentRenderer, looksLikeCode } from '../utils/contentRenderer';
import { inferDifficulty, isPracticeQuestion } from '../utils/difficulty';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import EditQuestionModal from '../components/EditQuestionModal';
import { useToast } from '../context/ToastContext';
import ReportQuestionModal from '../components/ReportQuestionModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function idFor(question) {
  return String(question?._id || question?.id || question?.legacy_id);
}

function idForAttempt(attempt) {
  return String(attempt?.question?._id || attempt?.question || attempt?.questionId);
}

function optionMap(question) {
  if (Array.isArray(question?.options)) return Object.fromEntries(question.options.map((value, index) => [String(index + 1), value]));
  return question?.options || {};
}

function answerKey(question) {
  const options = optionMap(question);
  const answer = String(question?.correct_answer || '').trim();
  if (Object.prototype.hasOwnProperty.call(options, answer)) return answer;
  const letter = answer.match(/^Option\s+([A-Za-z])\b/i) || answer.match(/^\(?([A-Za-z])\)?[.):]/);
  if (letter) {
    const numericKey = String(letter[1].toUpperCase().charCodeAt(0) - 64);
    if (options[numericKey] !== undefined) return numericKey;
    if (options[letter[1].toUpperCase()] !== undefined) return letter[1].toUpperCase();
  }
  const numeric = answer.match(/^Option\s+(\d+)\b/i) || answer.match(/^\(?(\d+)\)?[.):]/);
  if (numeric && options[numeric[1]] !== undefined) return numeric[1];
  const stripped = answer.replace(/^\(?[A-Za-z0-9]+\)?[.):]\s*/, '').toLowerCase();
  const exact = Object.entries(options).find(([, value]) => String(value).trim().toLowerCase() === answer.toLowerCase() || String(value).trim().toLowerCase() === stripped);
  return exact?.[0] || Object.keys(options)[0];
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

async function apiRequest(token, path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Unable to update progress.');
  return data;
}

function PracticeEngine() {
  const { user, token } = useAuth();
  const { questions, progress, setProgress, loading, error } = useApp();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', category: 'all', difficulty: 'all', status: 'all', source: 'all' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [palettePage, setPalettePage] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [requestError, setRequestError] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [reportingQuestion, setReportingQuestion] = useState(null);

  const attempts = progress.attempts || [];
  const bookmarks = progress.bookmarks || [];
  const reviewLater = progress.reviewLater || [];
  const attemptMap = useMemo(() => new Map(attempts.map((attempt) => [idForAttempt(attempt), attempt])), [attempts]);
  const categories = useMemo(() => [...new Set(questions.map((question) => question.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [questions]);
  const filteredQuestions = useMemo(() => questions.filter((question) => {
    const search = filters.search.trim().toLowerCase();
    const searchable = [question.question, question.category, question.shift, question.date, question.exam_name, question.section].filter(Boolean).join(' ').toLowerCase();
    const attempt = attemptMap.get(idFor(question));
    const sourceMatches = filters.source === 'all'
      || (filters.source === 'practice' && isPracticeQuestion(question))
      || (filters.source === 'pyq' && !isPracticeQuestion(question))
      || (filters.source === 'custom' && question.custom_added);
    const statusMatches = filters.status === 'all'
      || (filters.status === 'attempted' && Boolean(attempt))
      || (filters.status === 'unattempted' && !attempt)
      || (filters.status === 'correct' && attempt?.correct)
      || (filters.status === 'incorrect' && attempt && !attempt.correct);
    return (!search || searchable.includes(search))
      && (filters.category === 'all' || question.category === filters.category)
      && (filters.difficulty === 'all' || inferDifficulty(question) === filters.difficulty)
      && statusMatches && sourceMatches;
  }), [questions, filters, attemptMap]);

  const currentQuestion = filteredQuestions[selectedIndex];
  const currentAttempt = currentQuestion ? attemptMap.get(idFor(currentQuestion)) : null;
  const pageStart = palettePage * 30;
  const visiblePalette = filteredQuestions.slice(pageStart, pageStart + 30);
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / 30));

  useEffect(() => {
    setSelectedIndex((index) => Math.min(index, Math.max(filteredQuestions.length - 1, 0)));
    setPalettePage((page) => Math.min(page, Math.max(totalPages - 1, 0)));
  }, [filteredQuestions.length, totalPages]);

  useEffect(() => {
    if (!questions.length || !location.state) return;
    if (location.state.category) {
      setFilters((current) => ({ ...current, category: location.state.category }));
      setSelectedIndex(0);
      setPalettePage(0);
    } else if (location.state.questionId) {
      const targetIndex = filteredQuestions.findIndex((question) => idFor(question) === String(location.state.questionId));
      if (targetIndex >= 0) setSelectedIndex(targetIndex);
    }
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, questions.length]);

  useEffect(() => {
    setElapsed(0);
    const timer = window.setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [currentQuestion]);

  function changeFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
    setSelectedIndex(0);
    setPalettePage(0);
  }

  function selectQuestion(index) {
    setSelectedIndex(index);
    setPalettePage(Math.floor(index / 30));
  }

  async function selectOption(selectedOption) {
    if (!currentQuestion || (progress.settings?.lockAnswers && currentAttempt)) return;
    const correct = selectedOption === answerKey(currentQuestion);
    const questionId = currentQuestion._id;
    if (!questionId) return;
    setRequestError('');
    const optimisticAttempt = { question: questionId, selectedOption, correct, timestamp: new Date().toISOString() };
    setProgress((current) => ({
      ...current,
      attempts: [...current.attempts.filter((attempt) => !idForAttempt(attempt).includes(String(questionId))), optimisticAttempt],
      wrongQuestions: correct ? (current.wrongQuestions || []).filter((id) => String(id) !== String(questionId)) : (current.wrongQuestions || []).includes(questionId) ? current.wrongQuestions : [...(current.wrongQuestions || []), questionId],
      xp: current.xp + (current.attempts.some((attempt) => idForAttempt(attempt) === String(questionId)) ? 0 : 10),
    }));
    try {
      const updated = await apiRequest(token, '/api/progress/attempt', { method: 'POST', body: JSON.stringify({ questionId, selectedOption, correct }) });
      setProgress(updated);
      showToast('Answer saved.', 'success');
    } catch (actionError) {
      setRequestError(actionError.message);
      showToast(actionError.message, 'error');
    }
  }

  async function toggleList(path, field) {
    if (!currentQuestion?._id) return;
    setRequestError('');
    try {
      const updated = await apiRequest(token, `/api/progress/${path}/${currentQuestion._id}`, { method: 'PUT' });
      setProgress(updated);
      showToast(path === 'bookmark' ? 'Bookmark updated.' : 'Review tag updated.', 'success');
    } catch (actionError) {
      setRequestError(actionError.message);
      showToast(actionError.message, 'error');
    }
  }

  function clearAnswer() {
    if (!currentQuestion || !currentAttempt) return;
    setProgress((current) => ({
      ...current,
      attempts: current.attempts.filter((attempt) => idForAttempt(attempt) !== idFor(currentQuestion)),
      wrongQuestions: (current.wrongQuestions || []).filter((id) => String(id) !== idFor(currentQuestion)),
    }));
  }

  if (loading) return <section className="view-pane active"><div className="glass-card"><p>Loading questions...</p></div></section>;
  if (error) return <section className="view-pane active"><div className="glass-card"><p className="form-error">{error}</p></div></section>;

  return (
    <section className="view-pane active practice-page" id="practice-pane">
      <div className="filter-panel">
        <div className="search-box"><svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg><input name="search" value={filters.search} onChange={changeFilter} placeholder="Search by question, shift, dates, etc..." /></div>
        <select className="select-filter" name="category" value={filters.category} onChange={changeFilter}><option value="all">All Categories</option>{categories.map((category) => <option value={category} key={category}>{category}</option>)}</select>
        <select className="select-filter" name="difficulty" value={filters.difficulty} onChange={changeFilter}><option value="all">All Difficulties</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
        <select className="select-filter" name="status" value={filters.status} onChange={changeFilter}><option value="all">All Status</option><option value="unattempted">Unattempted</option><option value="attempted">Attempted</option><option value="correct">Correct</option><option value="incorrect">Incorrect</option></select>
        <select className="select-filter" name="source" value={filters.source} onChange={changeFilter}><option value="all">All Sources</option><option value="practice">Practice Questions Only</option><option value="pyq">PYQs Only</option><option value="custom">My Uploaded Questions Only</option></select>
      </div>

      {requestError && <p className="form-error practice-error" role="alert">{requestError}</p>}
      <div className="split-layout">
        <div className="glass-card practice-question-card">
          <div className="portal-header"><div><h3>Question #{currentQuestion?.question_number || selectedIndex + 1}</h3><span className="practice-exam">{currentQuestion?.exam_name || 'DSSSB TGT Prep'} {currentQuestion?.date ? `• ${currentQuestion.date}` : ''} {currentQuestion?.shift ? `• ${currentQuestion.shift}` : ''}</span></div><div className="practice-actions"><span className="practice-timer">{formatTime(elapsed)}</span>{user?.role === 'admin' && <button className="btn btn-secondary icon-button" type="button" title="Edit This Question" aria-label="Edit question" onClick={() => setEditingQuestion(currentQuestion)}>✎</button>}<button className={`btn btn-secondary icon-button ${currentQuestion && bookmarks.some((id) => String(id) === idFor(currentQuestion)) ? 'practice-active-action' : ''}`} type="button" title="Bookmark Question" aria-label="Bookmark question" onClick={() => toggleList('bookmark', 'bookmarks')}>♡</button><button className="btn btn-secondary icon-button" type="button" title="Report Question" aria-label="Report question" onClick={() => setReportingQuestion(currentQuestion)}>⚑</button></div></div>
          <div className="progress-bar-container"><div className="progress-bar-fill" style={{ width: filteredQuestions.length ? `${((selectedIndex + 1) / filteredQuestions.length) * 100}%` : '0%' }} /></div>
          {currentQuestion ? <div className="question-card-wrapper"><div className="question-meta-tags"><span className="meta-tag category">{currentQuestion.category || 'Discipline'}</span><span className="meta-tag difficulty">{inferDifficulty(currentQuestion)}</span><span className="meta-tag section">{currentQuestion.section || 'Part B'}</span><span className="meta-tag q-id">ID: {currentQuestion.id || currentQuestion.legacy_id || currentQuestion._id}</span></div><div className="question-text"><ContentRenderer text={currentQuestion.question} /></div><div className="options-list">{Object.entries(optionMap(currentQuestion)).map(([key, value]) => <button className={`question-option-card ${currentAttempt?.selectedOption === key ? 'selected' : ''} ${currentAttempt && key === answerKey(currentQuestion) ? 'correct-ans' : ''} ${currentAttempt && currentAttempt.selectedOption === key && key !== answerKey(currentQuestion) ? 'incorrect-ans' : ''}`} type="button" key={key} disabled={Boolean(progress.settings?.lockAnswers && currentAttempt)} onClick={() => selectOption(key)}><span className="option-indicator">{key}</span><span className={looksLikeCode(value) ? 'practice-code-option' : ''}><ContentRenderer text={value} /></span></button>)}</div></div> : <div className="empty-practice">No questions match your structured filter selections.</div>}
          {currentQuestion && currentAttempt && <div className="explanation-panel practice-explanation"><div className="explanation-title">{currentAttempt.correct ? '✔️ Correct Submission' : '❌ Incorrect Submission'}</div><div className="explanation-section"><div className="explanation-subtitle">Core Concept</div><div className="explanation-text"><ContentRenderer text={currentQuestion.correct_explanation || currentQuestion.answer_explanation || 'No correct explanation registered. Review the referenced study material.'} /></div></div><div className="explanation-section"><div className="explanation-subtitle">Why other options are incorrect</div><div className="explanation-text"><ContentRenderer text={currentQuestion.incorrect_explanation || 'No incorrect-option explanation registered for this question.'} /></div></div></div>}
          <div className="action-bar"><button className="btn btn-secondary" type="button" disabled={selectedIndex <= 0} onClick={() => selectQuestion(selectedIndex - 1)}>Previous</button><div className="btn-group"><button className="btn btn-secondary" type="button" disabled={!currentAttempt} onClick={clearAnswer}>Clear Option</button><button className="btn btn-accent" type="button" disabled={!currentQuestion} onClick={() => toggleList('review-later', 'reviewLater')}>Review Later</button></div><button className="btn btn-primary" type="button" disabled={selectedIndex >= filteredQuestions.length - 1} onClick={() => selectQuestion(selectedIndex + 1)}>Next</button></div>
        </div>

        <div className="glass-card"><div className="palette-title">Question Navigator</div><div className="palette-grid">{visiblePalette.map((question, index) => { const actualIndex = pageStart + index; const attempt = attemptMap.get(idFor(question)); const isReview = reviewLater.some((id) => String(id) === idFor(question)); const isBookmarked = bookmarks.some((id) => String(id) === idFor(question)); return <button className={`palette-btn ${isReview ? 'review' : attempt ? attempt.correct ? 'correct' : 'incorrect' : 'unvisited'} ${isBookmarked ? 'bookmarked' : ''} ${actualIndex === selectedIndex ? 'active-q' : ''}`} type="button" key={idFor(question)} onClick={() => selectQuestion(actualIndex)}>{actualIndex + 1}</button>; })}</div><div className="palette-pagination"><button className="palette-page-btn" type="button" disabled={palettePage === 0} onClick={() => setPalettePage((page) => page - 1)}>Previous</button><span className="palette-page-indicator">Page {Math.min(palettePage + 1, totalPages)} of {totalPages}</span><button className="palette-page-btn" type="button" disabled={palettePage >= totalPages - 1} onClick={() => setPalettePage((page) => page + 1)}>Next</button></div><div className="palette-legend"><div className="legend-item"><div className="legend-color" style={{ background: 'var(--bg-primary)' }} />Unvisited</div><div className="legend-item"><div className="legend-color" style={{ background: 'var(--success-light)', borderColor: 'var(--success)' }} />Correct</div><div className="legend-item"><div className="legend-color" style={{ background: 'var(--danger-light)', borderColor: 'var(--danger)' }} />Incorrect</div><div className="legend-item"><div className="legend-color" style={{ background: 'var(--warning-light)' }} />Review</div></div></div>
      </div>{editingQuestion && <EditQuestionModal question={editingQuestion} onClose={() => setEditingQuestion(null)} />}{reportingQuestion && <ReportQuestionModal question={reportingQuestion} onClose={() => setReportingQuestion(null)} />}
    </section>
  );
}

export default PracticeEngine;
