import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentRenderer } from '../utils/contentRenderer';
import { inferDifficulty } from '../utils/difficulty';

function questionId(question) {
  return question?._id || question?.id || question?.legacy_id;
}

function QuestionCard({ question, action = 'practice', onAction }) {
  const navigate = useNavigate();
  const actionLabel = action === 'unbookmark' ? 'Remove Bookmark' : 'Practice Again';

  function handleAction() {
    if (onAction) {
      onAction(question);
      return;
    }
    navigate('/practice', { state: { questionId: questionId(question) } });
  }

  return (
    <article className="glass-card question-summary-card">
      <div className="question-summary-top">
        <div className="question-meta-tags">
          <span className="meta-tag category">{question.category || 'Discipline'}</span>
          <span className="meta-tag difficulty">{inferDifficulty(question)}</span>
          {question.exam_name && <span className="meta-tag exam-info">{question.exam_name}</span>}
        </div>
        <span className="question-summary-number">Q{question.question_number || question.legacy_id || ''}</span>
      </div>
      <div className="question-summary-text"><ContentRenderer text={question.question} /></div>
      <div className="question-summary-footer">
        <span>{question.date || 'Question bank'}</span>
        <button className="btn btn-secondary" type="button" onClick={handleAction}>{actionLabel}</button>
      </div>
    </article>
  );
}

export { questionId };
export default QuestionCard;
