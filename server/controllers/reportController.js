const mongoose = require('mongoose');

const Question = require('../models/Question');
const QuestionReport = require('../models/QuestionReport');

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function createReport(req, res) {
  const { questionId, reason } = req.body;
  if (!questionId || !validId(questionId)) return res.status(404).json({ message: 'Question not found.' });
  if (!reason || !reason.trim()) return res.status(400).json({ message: 'Please explain what is wrong with this question.' });

  try {
    const question = await Question.findById(questionId).select('_id');
    if (!question) return res.status(404).json({ message: 'Question not found.' });
    const report = await QuestionReport.create({ question: questionId, reportedBy: req.user._id, reason: reason.trim() });
    return res.status(201).json(report);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: 'Report text is invalid.' });
    return res.status(500).json({ message: 'Unable to submit report.' });
  }
}

async function getReports(req, res) {
  try {
    const reports = await QuestionReport.find()
      .populate('question')
      .populate('reportedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });
    return res.json(reports);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load question reports.' });
  }
}

async function updateReport(req, res) {
  if (!validId(req.params.id)) return res.status(404).json({ message: 'Report not found.' });
  const { status, adminNote } = req.body;
  if (!['open', 'resolved', 'dismissed'].includes(status)) return res.status(400).json({ message: 'Invalid report status.' });

  try {
    const report = await QuestionReport.findByIdAndUpdate(
      req.params.id,
      { $set: { status, adminNote: adminNote?.trim() || '', resolvedBy: status === 'open' ? undefined : req.user._id, resolvedAt: status === 'open' ? undefined : new Date() } },
      { new: true, runValidators: true },
    ).populate('question').populate('reportedBy', 'name email').populate('resolvedBy', 'name email');
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    return res.json(report);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update report.' });
  }
}

module.exports = { createReport, getReports, updateReport };
