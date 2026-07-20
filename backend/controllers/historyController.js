const GeneratedFile = require('../models/GeneratedFile');

class HistoryController {
  static async getUserHistory(req, res) {
    try {
      const { page = 1, limit = 10, type, search } = req.query;
      const userId = req.user.id;

      // Build query
      const query = { userId };
      
      if (type) {
        query.type = type;
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      const skip = (page - 1) * limit;

      const [files, total] = await Promise.all([
        GeneratedFile.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .select('-content'), // Exclude content from list view
        GeneratedFile.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          files,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalFiles: total,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({ error: 'Failed to get user history' });
    }
  }

  static async getFileById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const file = await GeneratedFile.findOne({ _id: id, userId });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Increment download count
      await GeneratedFile.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } });

      res.json({
        success: true,
        data: file
      });
    } catch (error) {
      console.error('Get file error:', error);
      res.status(500).json({ error: 'Failed to get file' });
    }
  }

  static async updateFile(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { name, description, tags, isPublic } = req.body;

      const file = await GeneratedFile.findOne({ _id: id, userId });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Update allowed fields
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (tags !== undefined) updates.tags = tags;
      if (isPublic !== undefined) updates.isPublic = isPublic;

      const updatedFile = await GeneratedFile.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      res.json({
        success: true,
        data: updatedFile
      });
    } catch (error) {
      console.error('Update file error:', error);
      res.status(500).json({ error: 'Failed to update file' });
    }
  }

  static async deleteFile(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const file = await GeneratedFile.findOne({ _id: id, userId });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      await GeneratedFile.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }

  static async getStatistics(req, res) {
    try {
      const userId = req.user.id;

      const [
        totalFiles,
        filesByType,
        recentFiles,
        totalDownloads
      ] = await Promise.all([
        GeneratedFile.countDocuments({ userId }),
        GeneratedFile.aggregate([
          { $match: { userId } },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        GeneratedFile.find({ userId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name type createdAt'),
        GeneratedFile.aggregate([
          { $match: { userId } },
          { $group: { _id: null, total: { $sum: '$downloadCount' } } }
        ])
      ]);

      res.json({
        success: true,
        data: {
          totalFiles,
          filesByType: filesByType.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          recentFiles,
          totalDownloads: totalDownloads[0]?.total || 0
        }
      });
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  }

  static async duplicateFile(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const originalFile = await GeneratedFile.findOne({ _id: id, userId });
      
      if (!originalFile) {
        return res.status(404).json({ error: 'File not found' });
      }

      const duplicatedFile = new GeneratedFile({
        userId,
        type: originalFile.type,
        name: `${originalFile.name} (Copy)`,
        content: originalFile.content,
        inputs: originalFile.inputs,
        fileName: originalFile.fileName,
        description: originalFile.description ? `${originalFile.description} (Copy)` : '',
        tags: [...originalFile.tags],
        isPublic: false // Reset to private for duplicates
      });

      await duplicatedFile.save();

      res.status(201).json({
        success: true,
        data: duplicatedFile
      });
    } catch (error) {
      console.error('Duplicate file error:', error);
      res.status(500).json({ error: 'Failed to duplicate file' });
    }
  }
}

module.exports = HistoryController;
