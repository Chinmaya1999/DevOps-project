const DevOpsDoc = require('../models/DevOpsDoc');

class DevOpsDocController {
  static async getAllDocs(req, res) {
    try {
      const { category, technology, difficulty } = req.query;
      
      let filter = { isActive: true };
      
      if (category) filter.category = category;
      if (technology) filter.technology = new RegExp(technology, 'i');
      if (difficulty) filter.difficulty = difficulty;

      const docs = await DevOpsDoc.find(filter)
        .sort({ lastUpdated: -1 })
        .select('-__v');

      res.json({
        success: true,
        data: docs
      });
    } catch (error) {
      console.error('Get docs error:', error);
      res.status(500).json({ error: 'Failed to fetch documentation' });
    }
  }

  static async getDocById(req, res) {
    try {
      const doc = await DevOpsDoc.findById(req.params.id);
      
      if (!doc) {
        return res.status(404).json({ error: 'Documentation not found' });
      }

      res.json({
        success: true,
        data: doc
      });
    } catch (error) {
      console.error('Get doc error:', error);
      res.status(500).json({ error: 'Failed to fetch documentation' });
    }
  }

  static async createDoc(req, res) {
    try {
      const docData = {
        ...req.body,
        author: 'Admin',
        lastUpdated: new Date()
      };

      const doc = await DevOpsDoc.create(docData);

      res.status(201).json({
        success: true,
        data: doc,
        message: 'Documentation created successfully'
      });
    } catch (error) {
      console.error('Create doc error:', error);
      res.status(500).json({ error: 'Failed to create documentation' });
    }
  }

  static async updateDoc(req, res) {
    try {
      const updateData = {
        ...req.body,
        lastUpdated: new Date()
      };

      const doc = await DevOpsDoc.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!doc) {
        return res.status(404).json({ error: 'Documentation not found' });
      }

      res.json({
        success: true,
        data: doc,
        message: 'Documentation updated successfully'
      });
    } catch (error) {
      console.error('Update doc error:', error);
      res.status(500).json({ error: 'Failed to update documentation' });
    }
  }

  static async deleteDoc(req, res) {
    try {
      const doc = await DevOpsDoc.findByIdAndDelete(req.params.id);

      if (!doc) {
        return res.status(404).json({ error: 'Documentation not found' });
      }

      res.json({
        success: true,
        message: 'Documentation deleted successfully'
      });
    } catch (error) {
      console.error('Delete doc error:', error);
      res.status(500).json({ error: 'Failed to delete documentation' });
    }
  }

  static async getCategories(req, res) {
    try {
      const categories = await DevOpsDoc.distinct('category');
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  static async getTechnologies(req, res) {
    try {
      const technologies = await DevOpsDoc.find({ isActive: true })
        .distinct('technology')
        .sort();

      res.json({
        success: true,
        data: technologies
      });
    } catch (error) {
      console.error('Get technologies error:', error);
      res.status(500).json({ error: 'Failed to fetch technologies' });
    }
  }
}

module.exports = DevOpsDocController;
