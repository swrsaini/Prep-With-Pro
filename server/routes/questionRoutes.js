const express = require('express');

const {
	bulkImport,
	createQuestion,
	deleteQuestion,
	getCategories,
	getQuestions,
	updateQuestion,
} = require('../controllers/questionController');
const { adminOnly, protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getQuestions);
router.get('/categories', protect, getCategories);
router.post('/bulk-import', protect, adminOnly, bulkImport);
router.post('/', protect, adminOnly, createQuestion);
router.put('/:id', protect, adminOnly, updateQuestion);
router.delete('/:id', protect, adminOnly, deleteQuestion);

module.exports = router;
