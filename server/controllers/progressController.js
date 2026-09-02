const mongoose = require('mongoose');

const Question = require('../models/Question');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function sameId(first, second) {
  return first?.toString() === second?.toString();
}

function updateWrongQuestions(user, questionId, correct) {
  const wrongIndex = user.wrongQuestions.findIndex((id) => sameId(id, questionId));

  if (correct && wrongIndex !== -1) {
    user.wrongQuestions.splice(wrongIndex, 1);
  } else if (!correct && wrongIndex === -1) {
    user.wrongQuestions.push(questionId);
  }
}

function updateStreak(user, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (!user.lastAttemptDate) {
    user.streak = 1;
  } else {
    const lastAttemptDay = new Date(user.lastAttemptDate);
    lastAttemptDay.setHours(0, 0, 0, 0);
    const dayDifference = Math.round((today - lastAttemptDay) / 86400000);

    if (dayDifference === 1) {
      user.streak += 1;
    } else if (dayDifference > 1) {
      user.streak = 1;
    }
  }

  user.lastAttemptDate = now;
  user.longestStreak = Math.max(user.longestStreak || 0, user.streak);
}

function progressPayload(user) {
  return {
    bookmarks: user.bookmarks,
    wrongQuestions: user.wrongQuestions,
    reviewLater: user.reviewLater,
    attempts: user.attempts,
    streak: user.streak,
    longestStreak: user.longestStreak,
    lastAttemptDate: user.lastAttemptDate,
    xp: user.xp,
    settings: user.settings,
    history: user.history,
  };
}

async function getProgress(req, res) {
  return res.json(progressPayload(req.user));
}

async function recordAttempt(req, res) {
  const { questionId, selectedOption, correct } = req.body;
  if (!questionId || typeof correct !== 'boolean') {
    return res.status(400).json({ message: 'questionId and boolean correct are required.' });
  }
  if (!isValidId(questionId)) {
    return res.status(404).json({ message: 'Question not found.' });
  }

  try {
    const question = await Question.findById(questionId).select('_id');
    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    const now = new Date();
    const existingAttempt = req.user.attempts.find((attempt) => sameId(attempt.question, questionId));
    if (existingAttempt) {
      existingAttempt.selectedOption = selectedOption;
      existingAttempt.correct = correct;
      existingAttempt.timestamp = now;
    } else {
      req.user.attempts.push({ question: questionId, selectedOption, correct, timestamp: now });
      req.user.xp += 10;
    }

    updateWrongQuestions(req.user, questionId, correct);
    updateStreak(req.user, now);
    await req.user.save();

    return res.json(progressPayload(req.user));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to record attempt.' });
  }
}

async function toggleProgressList(req, res, field) {
  const { questionId } = req.params;
  if (!isValidId(questionId)) {
    return res.status(404).json({ message: 'Question not found.' });
  }

  try {
    const question = await Question.findById(questionId).select('_id');
    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    const list = req.user[field];
    const itemIndex = list.findIndex((id) => sameId(id, questionId));
    if (itemIndex === -1) list.push(questionId);
    else list.splice(itemIndex, 1);

    await req.user.save();
    return res.json({ [field]: req.user[field], ...progressPayload(req.user) });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update progress.' });
  }
}

async function toggleBookmark(req, res) {
  return toggleProgressList(req, res, 'bookmarks');
}

async function toggleReviewLater(req, res) {
  return toggleProgressList(req, res, 'reviewLater');
}

async function updateSettings(req, res) {
  const allowedSettings = ['darkMode', 'compactMode', 'autoNext', 'lockAnswers', 'audio'];
  const settingsUpdate = {};

  allowedSettings.forEach((setting) => {
    if (typeof req.body[setting] === 'boolean') settingsUpdate[setting] = req.body[setting];
  });

  if (!Object.keys(settingsUpdate).length) {
    return res.status(400).json({ message: 'At least one valid setting is required.' });
  }

  try {
    Object.assign(req.user.settings, settingsUpdate);
    await req.user.save();
    return res.json(progressPayload(req.user));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update settings.' });
  }
}

function submittedQuestionId(submittedQuestion) {
  if (typeof submittedQuestion === 'string') return submittedQuestion;
  return submittedQuestion?._id || submittedQuestion?.questionId || submittedQuestion?.id;
}

async function resolveSubmittedQuestion(submittedQuestion) {
  const identifier = submittedQuestionId(submittedQuestion);
  if (!identifier) return null;

  if (isValidId(identifier)) return Question.findById(identifier);
  const legacyId = Number(identifier);
  return Number.isNaN(legacyId) ? null : Question.findOne({ legacy_id: legacyId });
}

function submittedAnswer(answers, submittedQuestion, index) {
  if (Array.isArray(answers)) return answers[index];
  if (!answers || typeof answers !== 'object') return undefined;

  const identifier = submittedQuestionId(submittedQuestion);
  return answers[index] ?? answers[String(index)] ?? answers[identifier];
}

async function submitMockResult(req, res) {
  const { questions, answers, negativeMarking = 0, timeTaken = 0 } = req.body;
  if (!Array.isArray(questions) || !questions.length) {
    return res.status(400).json({ message: 'A non-empty questions array is required.' });
  }

  const parsedNegativeMarking = Number(negativeMarking);
  if (!Number.isFinite(parsedNegativeMarking) || parsedNegativeMarking < 0) {
    return res.status(400).json({ message: 'negativeMarking must be a non-negative number.' });
  }

  try {
    const resolvedQuestions = await Promise.all(questions.map(resolveSubmittedQuestion));
    if (resolvedQuestions.some((question) => !question)) {
      return res.status(404).json({ message: 'One or more submitted questions were not found.' });
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    const now = new Date();
    const attemptsByQuestion = new Map();

    resolvedQuestions.forEach((question, index) => {
      const selectedOption = submittedAnswer(answers, questions[index], index);
      const hasAnswer = selectedOption !== undefined && selectedOption !== null && selectedOption !== '';
      const correct = hasAnswer && String(selectedOption) === String(question.correct_answer);

      if (!hasAnswer) skippedCount += 1;
      else if (correct) correctCount += 1;
      else incorrectCount += 1;

      if (hasAnswer) {
        attemptsByQuestion.set(question._id.toString(), {
          question: question._id,
          selectedOption: String(selectedOption),
          correct,
          timestamp: now,
        });
        updateWrongQuestions(req.user, question._id, correct);
      }
    });

    const attempts = Array.from(attemptsByQuestion.values());
    attempts.forEach((attempt) => {
      const existingAttempt = req.user.attempts.find((item) => sameId(item.question, attempt.question));
      if (existingAttempt) Object.assign(existingAttempt, attempt);
      else req.user.attempts.push(attempt);
    });

    const score = correctCount - (incorrectCount * parsedNegativeMarking);
    const answeredCount = correctCount + incorrectCount;
    const accuracy = answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0;
    req.user.history.push({
      date: now,
      score,
      total: questions.length,
      accuracy,
      correct: correctCount,
      incorrect: incorrectCount,
      skipped: skippedCount,
    });
    req.user.xp += 100;
    if (attempts.length) updateStreak(req.user, now);
    await req.user.save();

    return res.json({
      score,
      accuracy,
      correct: correctCount,
      incorrect: incorrectCount,
      skipped: skippedCount,
      timeTaken: Number(timeTaken) || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to submit mock result.' });
  }
}

async function resetProgress(req, res) {
  try {
    req.user.bookmarks = [];
    req.user.wrongQuestions = [];
    req.user.reviewLater = [];
    req.user.attempts = [];
    req.user.streak = 0;
    req.user.xp = 0;
    req.user.history = [];
    req.user.lastAttemptDate = undefined;
    await req.user.save();
    return res.json(progressPayload(req.user));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to reset progress.' });
  }
}

module.exports = {
  getProgress,
  recordAttempt,
  toggleBookmark,
  toggleReviewLater,
  updateSettings,
  submitMockResult,
  resetProgress,
};
