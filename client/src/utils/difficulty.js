function inferDifficulty(question) {
  if (question?.difficulty) return question.difficulty;

  const length = (question?.question || '').length;
  if (length < 100) return 'Easy';
  if (length < 200) return 'Medium';
  return 'Hard';
}

function isPracticeQuestion(question) {
  return (question?.exam_name || '').trim().toLowerCase() === 'practice';
}

export { inferDifficulty, isPracticeQuestion };
