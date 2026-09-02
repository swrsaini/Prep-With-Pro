const express = require('express');

const { createReport, getReports, updateReport } = require('../controllers/reportController');
const { adminOnly, protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createReport);
router.get('/', protect, adminOnly, getReports);
router.patch('/:id', protect, adminOnly, updateReport);

module.exports = router;
