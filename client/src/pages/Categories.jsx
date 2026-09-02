import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function idFor(question) { return String(question?._id || question?.id || question?.legacy_id); }
function attemptId(attempt) { return String(attempt?.question?._id || attempt?.question || attempt?.questionId); }

function Categories() {
  const { questions, progress, loading, error } = useApp();
  const navigate = useNavigate();
  const attempts = useMemo(() => new Map((progress.attempts || []).map((attempt) => [attemptId(attempt), attempt])), [progress.attempts]);
  const categories = useMemo(() => [...new Set(questions.map((question) => question.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [questions]);

  if (loading) return <PageState text="Loading categories..." />;
  if (error) return <PageState text={error} error />;

  return <section className="view-pane active directory-page" id="category-pane"><h3 className="directory-title">Syllabus Breakdown</h3><p className="directory-intro">Select topics directly to target weaknesses or verify overall completion status.</p><div className="category-list-grid">{categories.map((category) => { const categoryQuestions = questions.filter((question) => question.category === category); const categoryAttempts = categoryQuestions.map((question) => attempts.get(idFor(question))).filter(Boolean); const correct = categoryAttempts.filter((attempt) => attempt.correct).length; const accuracy = categoryAttempts.length ? Math.round((correct / categoryAttempts.length) * 100) : null; return <button className="glass-card category-summary-card" type="button" key={category} onClick={() => navigate('/practice', { state: { category } })}><span className="category-summary-icon">◈</span><span className="category-summary-content"><strong>{category}</strong><small>{categoryQuestions.length} questions</small></span>{accuracy !== null && <span className="category-accuracy">{accuracy}%<small>accuracy</small></span>}<span className="category-arrow">-&gt;</span></button>; })}</div>{!categories.length && <div className="glass-card empty-directory">No questions have been loaded yet.</div>}</section>;
}

function PageState({ text, error = false }) { return <section className="view-pane active"><div className={`glass-card ${error ? 'form-error' : ''}`}>{text}</div></section>; }
export default Categories;
