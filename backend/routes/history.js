const express = require('express');
const { auth } = require('../middleware/auth');
const HistoryController = require('../controllers/historyController');

const router = express.Router();

// All history routes require authentication
router.use(auth);

// Get user's file history with pagination and filtering
router.get('/', HistoryController.getUserHistory);

// Get specific file by ID
router.get('/:id', HistoryController.getFileById);

// Update file metadata
router.put('/:id', HistoryController.updateFile);

// Delete a file
router.delete('/:id', HistoryController.deleteFile);

// Duplicate a file
router.post('/:id/duplicate', HistoryController.duplicateFile);

// Get user statistics
router.get('/stats/overview', HistoryController.getStatistics);

module.exports = router;
