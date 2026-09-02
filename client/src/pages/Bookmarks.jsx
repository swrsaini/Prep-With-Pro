import React, { useMemo, useState } from 'react';
import QuestionCard, { questionId } from '../components/QuestionCard';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
function idFor(question) { return String(question?._id || question?.id || question?.legacy_id); }

function Bookmarks() {
  const { token } = useAuth();
  const { questions, progress, setProgress, loading, error } = useApp();
  const { showToast } = useToast();
  const [actionError, setActionError] = useState('');
  const bookmarked = useMemo(() => new Set((progress.bookmarks || []).map(String)), [progress.bookmarks]);
  const items = questions.filter((question) => bookmarked.has(idFor(question)));

  async function removeBookmark(question) {
    try {
      const response = await fetch(`${API_URL}/api/progress/bookmark/${questionId(question)}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to remove bookmark.');
      setProgress(data);
      showToast('Bookmark removed.', 'success');
    } catch (requestError) { setActionError(requestError.message); showToast(requestError.message, 'error'); }
  }

  if (loading) return <PageState text="Loading bookmarks..." />;
  if (error) return <PageState text={error} error />;
  return <section className="view-pane active directory-page" id="bookmarks-pane"><h3 className="directory-title">Bookmarked Questions</h3><p className="directory-intro">Questions highlighted during practices for fast review and manual processing.</p>{actionError && <p className="form-error">{actionError}</p>}<div className="question-directory-list">{items.map((question) => <QuestionCard question={question} action="unbookmark" onAction={removeBookmark} key={idFor(question)} />)}</div>{!items.length && <div className="glass-card empty-directory">No bookmarked questions yet. Save questions from the Practice Engine for quick review.</div>}</section>;
}
function PageState({ text, error = false }) { return <section className="view-pane active"><div className={`glass-card ${error ? 'form-error' : ''}`}>{text}</div></section>; }
export default Bookmarks;
