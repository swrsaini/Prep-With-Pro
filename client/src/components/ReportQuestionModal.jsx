import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ReportQuestionModal({ question, onClose }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Please explain what is wrong with this question.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questionId: question._id, reason }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to submit report.');
      showToast('Question report submitted.', 'success');
      onClose();
    } catch (submitError) {
      setError(submitError.message);
      showToast(submitError.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return <div className="modal-overlay active-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card report-modal" role="dialog" aria-modal="true" aria-labelledby="report-question-title"><button className="modal-close" type="button" aria-label="Close report dialog" onClick={onClose}>×</button><div className="modal-title" id="report-question-title">⚑ Report Question</div><p className="report-question-preview">Question #{question.question_number || question.legacy_id || ''}: {question.question}</p><form onSubmit={submit}><label className="report-label" htmlFor="report-reason">What is wrong with this question?</label><textarea id="report-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain the incorrect answer, typo, missing information, or other issue..." maxLength={2000} autoFocus />{error && <p className="form-error" role="alert">{error}</p>}<div className="editor-actions"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Submitting...' : 'Submit Report'}</button><button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button></div></form></section></div>;
}

export default ReportQuestionModal;
