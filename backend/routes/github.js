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

// Get repository file structure
router.get('/files/:owner/:repo', auth, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { token, path = '' } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'GitHub token is required' });
    }

    const files = await githubIntegration.getFileStructure(owner, repo, token, path);
    res.json({ files });
  } catch (error) {
    console.error('Error fetching file structure:', error);
    if (error.response?.status === 404) {
      res.status(404).json({ error: 'Repository not found or access denied' });
    } else if (error.response?.status === 401) {
      res.status(401).json({ error: 'Invalid GitHub token' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get file content
router.get('/file/:owner/:repo', auth, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { token, path } = req.query;
    
    if (!token || !path) {
      return res.status(400).json({ error: 'GitHub token and file path are required' });
    }

    const content = await githubIntegration.getFileContent(owner, repo, token, path);
    res.json({ content });
  } catch (error) {
    console.error('Error fetching file content:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update file content
router.put('/file/:owner/:repo', auth, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { token, path, content, message } = req.body;
    
    if (!token || !path || !content) {
      return res.status(400).json({ error: 'GitHub token, file path, and content are required' });
    }

    const result = await githubIntegration.updateFileContent(owner, repo, token, path, content, message);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error updating file content:', error);
    res.status(500).json({ error: error.message });
  }
});

// Build Docker image and push to Docker Hub
router.post('/build-docker', auth, async (req, res) => {
  try {
    const { token, owner, repo, dockerHubUsername, dockerHubToken, imageName, tag } = req.body;
    
    if (!token || !owner || !repo || !dockerHubUsername || !dockerHubToken) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = await githubIntegration.buildAndPushDockerImage(
      token, owner, repo, dockerHubUsername, dockerHubToken, imageName, tag
    );
    res.json({ success: true, logs: result.logs });
  } catch (error) {
    console.error('Error building Docker image:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get repository branches
router.get('/branches/:owner/:repo', auth, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'GitHub token is required' });
    }

    const branches = await githubIntegration.getRepositoryBranches(owner, repo, token);
    res.json({ branches });
  } catch (error) {
    console.error('Error fetching branches:', error);
    if (error.response?.status === 404) {
      res.status(404).json({ error: 'Repository not found or access denied' });
    } else if (error.response?.status === 401) {
      res.status(401).json({ error: 'Invalid GitHub token' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get repository commits
router.get('/commits/:owner/:repo', auth, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { token, branch, limit = 10 } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'GitHub token is required' });
    }

    // If branch not specified, get the default branch from repository details
    let targetBranch = branch;
    if (!targetBranch) {
      try {
        const repoDetails = await githubIntegration.getRepositoryDetails(owner, repo, token);
        targetBranch = repoDetails.default_branch || 'main';
      } catch (repoError) {
        console.error('Error fetching repository details:', repoError);
        return res.status(404).json({ error: 'Repository not found or access denied' });
      }
    }

    const commits = await githubIntegration.getRepositoryCommits(owner, repo, token, targetBranch, limit);
    res.json({ commits });
  } catch (error) {
    console.error('Error fetching commits:', error);
    if (error.response?.status === 404) {
      res.status(404).json({ error: 'Repository or branch not found' });
    } else if (error.response?.status === 401) {
      res.status(401).json({ error: 'Invalid GitHub token' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;
