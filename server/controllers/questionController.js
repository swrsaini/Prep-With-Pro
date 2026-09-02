const mongoose = require('mongoose');

const Question = require('../models/Question');
const QuestionReport = require('../models/QuestionReport');
const { normalizeQuestionPayload } = require('../utils/normalizeQuestion');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getQuestions(req, res) {
  try {
    const questions = await Question.find().sort({ legacy_id: 1 });
    return res.json(questions);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load questions.' });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await Question.distinct('category');
    return res.json(categories.sort((first, second) => first.localeCompare(second)));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load categories.' });
  }
}

async function createQuestion(req, res) {
  try {
    const question = await Question.create({ ...req.body, createdBy: req.user._id });
    return res.status(201).json(question);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Category and question text are required.' });
    }
    return res.status(500).json({ message: 'Unable to create question.' });
  }
}

async function updateQuestion(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(404).json({ message: 'Question not found.' });
  }

  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $set: { ...req.body, edited_at: new Date() } },
      { new: true, runValidators: true },
    );

    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    await QuestionReport.updateMany(
      { question: question._id, status: 'open' },
      { $set: { status: 'resolved', resolvedBy: req.user._id, resolvedAt: new Date() } },
    );

    return res.json(question);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid question data.' });
    }
    return res.status(500).json({ message: 'Unable to update question.' });
  }
}

async function deleteQuestion(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(404).json({ message: 'Question not found.' });
  }

  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    await QuestionReport.updateMany(
      { question: question._id, status: 'open' },
      { $set: { status: 'resolved', resolvedBy: req.user._id, resolvedAt: new Date() } },
    );

    return res.json({ message: 'Question deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete question.' });
  }
}

async function bulkImport(req, res) {
  const documents = normalizeQuestionPayload(req.body);
  if (!documents) {
    return res.status(400).json({ message: 'The request must contain a questions array.' });
  }

  try {
    const documentsById = new Map();
    documents.forEach((document) => {
      if (document.legacy_id !== undefined && document.legacy_id !== null) {
        documentsById.set(document.legacy_id, document);
      }
    });

    const uniqueDocuments = Array.from(documentsById.values());
    const legacyIds = uniqueDocuments.map((document) => document.legacy_id);
    const existing = await Question.find({ legacy_id: { $in: legacyIds } }).select('legacy_id').lean();
    const existingIds = new Set(existing.map((question) => question.legacy_id));
    const newDocuments = uniqueDocuments.filter((document) => !existingIds.has(document.legacy_id));

    if (newDocuments.length) {
      await Question.insertMany(newDocuments);
    }

    return res.status(201).json({
      inserted: newDocuments.length,
      skipped: documents.length - newDocuments.length,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'One or more questions are invalid.' });
    }
    return res.status(500).json({ message: 'Unable to import questions.' });
  }
}

module.exports = {
  getQuestions,
  getCategories,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImport,
};
