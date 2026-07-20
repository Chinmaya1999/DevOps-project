const dockerHubService = require('../services/dockerHubService');

// Search Docker Hub images
exports.searchImages = async (req, res) => {
  try {
    const { query, page = 1, pageSize = 20, pat } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required'
      });
    }

    const result = await dockerHubService.searchImages(query, page, pageSize, pat);

    res.json(result);
  } catch (error) {
    console.error('Search images error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to search images: ${error.message}`
    });
  }
};

// Get image tags
exports.getImageTags = async (req, res) => {
  try {
    const { imageName } = req.params;
    const { page = 1, pageSize = 20, pat } = req.query;

    const result = await dockerHubService.getImageTags(imageName, page, pageSize, pat);

    res.json(result);
  } catch (error) {
    console.error('Get image tags error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get image tags: ${error.message}`
    });
  }
};

// Get user images
exports.getUserImages = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, pageSize = 20, pat } = req.query;

    const result = await dockerHubService.getUserImages(username, page, pageSize, pat);

    res.json(result);
  } catch (error) {
    console.error('Get user images error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get user images: ${error.message}`
    });
  }
};
