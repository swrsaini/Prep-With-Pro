function normalizeQuestionOptions(question) {
  const normalized = { ...question };

  if (Array.isArray(normalized.options)) {
    normalized.options = normalized.options.reduce((options, value, index) => {
      options[String(index + 1)] = value;
      return options;
    }, {});
  }

  if (normalized.question_number !== undefined && normalized.question_number !== null) {
    const numericQuestionNumber = Number(normalized.question_number);
    if (Number.isFinite(numericQuestionNumber)) {
      normalized.question_number = numericQuestionNumber;
    } else {
      delete normalized.question_number;
    }
  }

  return normalized;
}

function normalizeQuestionPayload(payload) {
  const questions = Array.isArray(payload) ? payload : payload?.questions;
  if (!Array.isArray(questions)) {
    return null;
  }

  return questions.map((question) => {
    const { id, ...questionData } = normalizeQuestionOptions(question);
    return {
      ...questionData,
      ...(id !== undefined ? { legacy_id: id } : {}),
    };
  });
}

module.exports = { normalizeQuestionOptions, normalizeQuestionPayload };
