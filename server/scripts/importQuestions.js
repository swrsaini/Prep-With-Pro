const fs = require('fs/promises');
const path = require('path');

const dotenv = require('dotenv');
const mongoose = require('mongoose');

const Question = require('../models/Question');
const { normalizeQuestionPayload } = require('../utils/normalizeQuestion');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function getInputFilePath() {
  const fileFlagIndex = process.argv.indexOf('--file');
  const requestedFile = fileFlagIndex >= 0 ? process.argv[fileFlagIndex + 1] : null;

  if (fileFlagIndex >= 0 && !requestedFile) {
    throw new Error('The --file option requires a file path.');
  }

  return requestedFile
    ? path.resolve(process.cwd(), requestedFile)
    : path.resolve(__dirname, '../../reference/questions.json');
}

async function importQuestions() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set in server/.env.');
  }

  const inputFilePath = getInputFilePath();
  const fileContents = await fs.readFile(inputFilePath, 'utf8');
  const parsedData = JSON.parse(fileContents);
  const questions = Array.isArray(parsedData) ? parsedData : parsedData.questions;

  if (!Array.isArray(questions)) {
    throw new Error('The input file must contain a questions array.');
  }

  const documents = normalizeQuestionPayload(questions);

  await mongoose.connect(process.env.MONGO_URI);

  const legacyIds = documents
    .map((question) => question.legacy_id)
    .filter((legacyId) => legacyId !== undefined && legacyId !== null);
  const existingQuestions = await Question.find({ legacy_id: { $in: legacyIds } })
    .select('legacy_id')
    .lean();
  const existingIds = new Set(existingQuestions.map((question) => question.legacy_id));
  const newDocuments = documents.filter((question) => !existingIds.has(question.legacy_id));

  if (newDocuments.length > 0) {
    await Question.insertMany(newDocuments);
  }

  const totalInDatabase = await Question.countDocuments();
  console.log(`Inserted: ${newDocuments.length}`);
  console.log(`Skipped: ${documents.length - newDocuments.length}`);
  console.log(`Total questions in database: ${totalInDatabase}`);
}

if (require.main === module) {
  importQuestions()
    .catch((error) => {
      console.error('Question import failed:', error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    });
}

module.exports = { getInputFilePath, importQuestions };
