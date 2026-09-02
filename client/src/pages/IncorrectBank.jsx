import React, { useMemo } from 'react';
import QuestionCard from '../components/QuestionCard';
import { useApp } from '../context/AppContext';

function idFor(question) { return String(question?._id || question?.id || question?.legacy_id); }

function IncorrectBank() {
  const { questions, progress, loading, error } = useApp();
  const wrongIds = useMemo(() => new Set((progress.wrongQuestions || []).map(String)), [progress.wrongQuestions]);
  const items = questions.filter((question) => wrongIds.has(idFor(question)));
  if (loading) return <PageState text="Loading incorrect bank..." />;
  if (error) return <PageState text={error} error />;
  return <section className="view-pane active directory-page" id="wrong-questions-pane"><h3 className="directory-title">Incorrect Bank</h3><p className="directory-intro">Every mistake is registered here automatically. Review, retry and clear them from your error ledger once mastered.</p><div className="question-directory-list">{items.map((question) => <QuestionCard question={question} key={idFor(question)} />)}</div>{!items.length && <div className="glass-card empty-directory">Your incorrect bank is clear. Questions you miss will appear here.</div>}</section>;
}
function PageState({ text, error = false }) { return <section className="view-pane active"><div className={`glass-card ${error ? 'form-error' : ''}`}>{text}</div></section>; }
export default IncorrectBank;
