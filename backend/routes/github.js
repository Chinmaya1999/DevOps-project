const express = require('express');
const router = express.Router();
const githubIntegration = require('../services/githubIntegration');
const { auth } = require('../middleware/auth');

// Get user repositories
router.get('/repositories', auth, async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'GitHub token is required' });
    }

    const repositories = await githubIntegration.getUserRepositories(token);
    res.json({ repositories });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze repository
router.get('/analyze/:owner/:repo', auth, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'GitHub token is required' });
    }

    const analysis = await githubIntegration.analyzeRepository(owner, repo, token);
    res.json({ analysis });
  } catch (error) {
    console.error('Error analyzing repository:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get repository details
router.get('/repository/:owner/:repo', auth, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'GitHub token is required' });
    }

    const details = await githubIntegration.getRepositoryDetails(owner, repo, token);
    res.json({ details });
  } catch (error) {
    console.error('Error fetching repository details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Detect tech stack from repository
router.get('/detect-stack/:owner/:repo', auth, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'GitHub token is required' });
    }

    const stack = await githubIntegration.detectTechStack(owner, repo, token);
    res.json({ stack });
  } catch (error) {
    console.error('Error detecting tech stack:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
