import React, { useState } from 'react';
import QuestionEditorForm from './QuestionEditorForm';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function EditQuestionModal({ question, onClose }) {
  const { token } = useAuth();
  const { questions, setQuestions } = useApp();
  const [error, setError] = useState('');
  const categories = [...new Set(questions.map((item) => item.category).filter(Boolean))].sort();

  async function updateQuestion(payload) {
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/questions/${question._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update question.');
      setQuestions((current) => current.map((item) => item._id === data._id ? data : item));
      onClose();
    } catch (updateError) { setError(updateError.message); }
  }

  async function deleteQuestion() {
    if (!window.confirm('Delete this question permanently?')) return;
    try {
      const response = await fetch(`${API_URL}/api/questions/${question._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to delete question.');
      setQuestions((current) => current.filter((item) => item._id !== question._id));
      onClose();
    } catch (deleteError) { setError(deleteError.message); }
  }

  return <div className="modal-overlay active-modal admin-edit-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card edit-question-modal" role="dialog" aria-modal="true" aria-labelledby="edit-question-title"><button className="modal-close" type="button" aria-label="Close edit question dialog" onClick={onClose}>×</button><div className="modal-title" id="edit-question-title">✏️ Edit Question #{question.legacy_id || question.id || question._id}</div>{error && <p className="form-error">{error}</p>}<QuestionEditorForm initialQuestion={question} categories={categories} submitLabel="Save Changes" onSubmit={updateQuestion} onCancel={onClose} onDelete={deleteQuestion} /></section></div>;
}

export default EditQuestionModal;
