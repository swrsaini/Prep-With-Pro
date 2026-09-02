const express = require('express');

const {
	getProgress,
	recordAttempt,
	resetProgress,
	submitMockResult,
	toggleBookmark,
	toggleReviewLater,
	updateSettings,
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', getProgress);
router.post('/attempt', recordAttempt);
router.put('/bookmark/:questionId', toggleBookmark);
router.put('/review-later/:questionId', toggleReviewLater);
router.put('/settings', updateSettings);
router.post('/mock-result', submitMockResult);
router.post('/reset', resetProgress);

module.exports = router;
