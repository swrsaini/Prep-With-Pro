const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    wrongQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    reviewLater: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    attempts: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
        selectedOption: String,
        correct: Boolean,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastAttemptDate: Date,
    xp: { type: Number, default: 0 },
    settings: {
      darkMode: { type: Boolean, default: false },
      compactMode: { type: Boolean, default: false },
      autoNext: { type: Boolean, default: false },
      lockAnswers: { type: Boolean, default: true },
      audio: { type: Boolean, default: false },
    },
    history: [
      {
        date: Date,
        score: Number,
        total: Number,
        accuracy: Number,
        correct: Number,
        incorrect: Number,
        skipped: Number,
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
