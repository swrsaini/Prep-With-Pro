const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    legacy_id: { type: Number, index: true },
    exam_name: String,
    date: String,
    shift: String,
    section: String,
    question_number: Number,
    category: { type: String, index: true, required: true },
    question: { type: String, required: true },
    options: { type: Map, of: String },
    correct_answer: String,
    answer_explanation: String,
    correct_explanation: String,
    incorrect_explanation: String,
    options_explanation: String,
    note: String,
    custom_added: { type: Boolean, default: false },
    code_recovered: Boolean,
    recovery_confidence: String,
    added_at: Date,
    edited_at: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Question', questionSchema);
