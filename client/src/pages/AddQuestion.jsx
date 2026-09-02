import React, { useState } from 'react';
import QuestionEditorForm from '../components/QuestionEditorForm';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AddQuestion() {
  const { token } = useAuth();
  const { questions, setQuestions } = useApp();
  const { showToast } = useToast();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [importedQuestion, setImportedQuestion] = useState(null);
  const [editorVersion, setEditorVersion] = useState(0);

  const demoJson = JSON.stringify({
    exam_name: 'DSSSB TGT Computer Science',
    date: '25 June 2023',
    shift: 'Shift 2',
    section: 'Discipline 1',
    question_number: 1,
    category: 'Computer Networks',
    question: 'Which protocol is used to transfer web pages?',
    options: { '1': 'HTTP', '2': 'FTP', '3': 'SMTP', '4': 'SSH' },
    correct_answer: '1',
    correct_explanation: 'HTTP is the protocol used to transfer web pages between web clients and servers.',
    incorrect_explanation: 'FTP transfers files, SMTP handles email, and SSH provides secure shell access.',
  }, null, 2);

  async function saveQuestion(question) {
    setMessage('');
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...question, custom_added: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to save question.');
      setQuestions((current) => [...current, data]);
      setMessage('Question saved successfully.');
      showToast('Question saved successfully.', 'success');
    } catch (saveError) { setError(saveError.message); showToast(saveError.message, 'error'); }
  }

  function fillFromJson() {
    setMessage('');
    setError('');
    try {
      const parsed = JSON.parse(jsonInput);
      const question = Array.isArray(parsed) ? parsed[0] : parsed.questions?.[0] || parsed;
      if (!question || typeof question !== 'object' || Array.isArray(question)) throw new Error('JSON must contain one question object or a questions array.');
      if (!question.category || !question.question || !question.options || !question.correct_answer) throw new Error('JSON must include category, question, options, and correct_answer.');
      setImportedQuestion(question);
      setEditorVersion((version) => version + 1);
      showToast('Question fields filled from JSON.', 'success');
    } catch (parseError) {
      setError(parseError.message || 'Unable to parse JSON.');
      showToast(parseError.message || 'Unable to parse JSON.', 'error');
    }
  }

  return <section className="view-pane active admin-page" id="add-question-pane"><div className="glass-card admin-intro-card"><h3>➕ Add a New Question</h3><p>Build a question with multiple options, a correct answer, and an explanation. Embed code, images, or match-column content directly into your question.</p></div><div className="glass-card json-question-import"><div className="json-import-heading"><div><h3>Import Question from JSON</h3><p>Paste one question object or a JSON file containing a <code>questions</code> array to fill the form automatically.</p></div><span className="json-import-badge">FAST FILL</span></div><div className="json-import-grid"><div><label className="json-label" htmlFor="question-json-input">Question JSON</label><textarea id="question-json-input" value={jsonInput} onChange={(event) => setJsonInput(event.target.value)} placeholder="Paste question JSON here..." spellCheck="false" /><div className="json-import-actions"><button className="btn btn-primary" type="button" disabled={!jsonInput.trim()} onClick={fillFromJson}>Fill Form from JSON</button><button className="btn btn-secondary" type="button" onClick={() => setJsonInput(demoJson)}>Load Demo JSON</button></div></div><div><div className="json-label">Demo JSON structure</div><pre className="json-demo"><code>{demoJson}</code></pre></div></div></div><div className="aq-layout"><div className="glass-card"><QuestionEditorForm key={editorVersion} initialQuestion={importedQuestion || undefined} categories={questions.map((question) => question.category).filter(Boolean).filter((category, index, list) => list.indexOf(category) === index).sort()} onSubmit={saveQuestion} statusMessage={message} statusError={error} /></div></div></section>;
}

export default AddQuestion;
