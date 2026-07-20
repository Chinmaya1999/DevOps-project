const axios = require('axios');

class DockerHubService {
  constructor() {
    this.baseURL = 'https://hub.docker.com/v2';
    this.bearerTokenCache = new Map();
  }

  async getBearerToken(pat) {
    if (!pat) return null;
    
    // Check cache first
    if (this.bearerTokenCache.has(pat)) {
      const cached = this.bearerTokenCache.get(pat);
      if (cached.expires > Date.now()) {
        return cached.token;
      }
    }

    try {
      // Try to exchange PAT for bearer token
      const response = await axios.post(`${this.baseURL}/auth/token`, {
        grant_type: 'pat',
        pat: pat
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const bearerToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 300; // Default 5 minutes
      
      // Cache the token
      this.bearerTokenCache.set(pat, {
        token: bearerToken,
        expires: Date.now() + (expiresIn * 1000)
      });

      return bearerToken;
    } catch (error) {
      console.error('Failed to exchange PAT for bearer token, will try without auth:', error.message);
      return null;
    }
  }

  getAuthHeaders(token) {
    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      };
    }
    return {};
  }

  async searchImages(query, page = 1, pageSize = 20, pat = null) {
    try {
      const bearerToken = await this.getBearerToken(pat);
      
      const response = await axios.get(`${this.baseURL}/search/repositories`, {
        params: {
          query,
          page,
          page_size: pageSize
        },
        headers: this.getAuthHeaders(bearerToken)
      });

      return {
        success: true,
        images: response.data.results.map(img => ({
          name: img.name,
          slug: img.slug,
          description: img.short_description,
          pullCount: img.pull_count,
          starCount: img.star_count,
          isOfficial: img.is_official,
          isAutomated: img.is_automated
        }))
      };
    } catch (error) {
      console.error('Docker Hub search error:', error);
      return {
        success: false,
        message: `Failed to search Docker Hub: ${error.message}`
      };
    }
  }

  async getImageTags(imageName, page = 1, pageSize = 20, pat = null) {
    try {
      const bearerToken = await this.getBearerToken(pat);
      
      const response = await axios.get(`${this.baseURL}/repositories/${imageName}/tags`, {
        params: {
          page,
          page_size: pageSize
        },
        headers: this.getAuthHeaders(bearerToken)
      });

      return {
        success: true,
        tags: response.data.results.map(tag => ({
          name: tag.name,
          lastUpdated: tag.last_updated,
          fullSize: tag.full_size,
          images: tag.images?.map(img => ({
            architecture: img.architecture,
            os: img.os,
            size: img.size
          })) || []
        }))
      };
    } catch (error) {
      console.error('Docker Hub tags error:', error);
      return {
        success: false,
        message: `Failed to fetch image tags: ${error.message}`
      };
    }
  }

  async getUserImages(username, page = 1, pageSize = 20, pat = null) {
    try {
      const bearerToken = await this.getBearerToken(pat);
      
      const response = await axios.get(`${this.baseURL}/repositories/${username}`, {
        params: {
          page,
          page_size: pageSize
        },
        headers: this.getAuthHeaders(bearerToken)
      });

      return {
        success: true,
        images: response.data.results.map(img => ({
          name: img.name,
          slug: img.slug,
          description: img.short_description,
          pullCount: img.pull_count,
          starCount: img.star_count,
          isPrivate: img.is_private,
          lastUpdated: img.last_updated
        }))
      };
    } catch (error) {
      console.error('Docker Hub user images error:', error);
      // If authentication fails, try without it for public images
      if (pat) {
        console.log('Retrying without authentication for public images...');
        try {
          const response = await axios.get(`${this.baseURL}/repositories/${username}`, {
            params: {
              page,
              page_size: pageSize
            }
          });

          return {
            success: true,
            images: response.data.results.map(img => ({
              name: img.name,
              slug: img.slug,
              description: img.short_description,
              pullCount: img.pull_count,
              starCount: img.star_count,
              isPrivate: img.is_private,
              lastUpdated: img.last_updated
            }))
          };
        } catch (retryError) {
          console.error('Retry without auth also failed:', retryError);
          return {
            success: false,
            message: `Failed to fetch user images: ${retryError.message}`
          };
        }
      }
      return {
        success: false,
        message: `Failed to fetch user images: ${error.message}`
      };
    }
  }
}

module.exports = new DockerHubService();
