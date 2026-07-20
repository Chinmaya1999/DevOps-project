const express = require('express');
const router = express.Router();
const dockerHubController = require('../controllers/dockerHubController');
const { auth } = require('../middleware/auth');

// Search Docker Hub images
router.get('/search', auth, dockerHubController.searchImages);

// Get image tags
router.get('/tags/:imageName', auth, dockerHubController.getImageTags);

// Get user images
router.get('/user/:username', auth, dockerHubController.getUserImages);

module.exports = router;
