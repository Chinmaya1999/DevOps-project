const Blog = require('../models/Blog');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/blogs';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit per file
    fieldSize: 50 * 1024 * 1024 // 50MB limit for non-file fields
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, gif) and PDFs are allowed'));
    }
  }
});

// Create a new blog
const createBlog = async (req, res) => {
  try {
    const { title, content, category, tags, coverImage, status } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Process uploaded files
    const images = [];
    const pdfs = [];

    if (req.files && req.files.images) {
      const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      imageFiles.forEach(file => {
        images.push(`/uploads/blogs/${file.filename}`);
      });
    }

    if (req.files && req.files.pdfs) {
      const pdfFiles = Array.isArray(req.files.pdfs) ? req.files.pdfs : [req.files.pdfs];
      pdfFiles.forEach(file => {
        pdfs.push(`/uploads/blogs/${file.filename}`);
      });
    }

    const blog = new Blog({
      title,
      content,
      author: req.user.id,
      authorName: user.username,
      authorAvatar: user.avatar,
      category: category || 'General',
      tags: tags || [],
      coverImage: coverImage || '',
      images: images,
      pdfs: pdfs,
      status: status || 'published'
    });

    await blog.save();

    res.status(201).json({
      message: 'Blog created successfully',
      blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ error: 'Server error creating blog' });
  }
};

// Get all blogs (public)
const getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, sort = '-createdAt' } = req.query;
    
    const query = { status: 'published' };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const blogs = await Blog.find(query)
      .populate('author', 'username avatar')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * 1);

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all blogs error:', error);
    res.status(500).json({ error: 'Server error fetching blogs' });
  }
};

// Get a single blog by ID
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'username avatar email')
      .populate('likes', 'username avatar')
      .populate('comments.user', 'username avatar');

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Get anonymous user ID from header (set by frontend)
    const anonymousUserId = req.headers['x-anonymous-user-id'];

    // Increment view count only if user hasn't viewed this blog before
    let shouldIncrement = false;

    if (req.user) {
      // Authenticated user
      if (!blog.viewedBy.includes(req.user.id)) {
        blog.viewedBy.push(req.user.id);
        shouldIncrement = true;
      }
    } else if (anonymousUserId) {
      // Anonymous user with ID from header
      if (!blog.viewedByAnonymous.includes(anonymousUserId)) {
        blog.viewedByAnonymous.push(anonymousUserId);
        shouldIncrement = true;
      }
    }

    if (shouldIncrement) {
      blog.views += 1;
      await blog.save();
    }

    res.json({ blog });
  } catch (error) {
    console.error('Get blog by ID error:', error);
    res.status(500).json({ error: 'Server error fetching blog' });
  }
};

// Get blogs by current user
const getUserBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { author: req.user.id };
    
    if (status) {
      query.status = status;
    }

    const blogs = await Blog.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * 1);

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get user blogs error:', error);
    res.status(500).json({ error: 'Server error fetching user blogs' });
  }
};

// Update a blog
const updateBlog = async (req, res) => {
  try {
    const { title, content, category, tags, coverImage, status } = req.body;
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Check if user is the author or admin
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this blog' });
    }

    if (title) blog.title = title;
    if (content) blog.content = content;
    if (category) blog.category = category;
    if (tags) blog.tags = tags;
    if (coverImage !== undefined) blog.coverImage = coverImage;
    if (status) blog.status = status;

    await blog.save();

    res.json({
      message: 'Blog updated successfully',
      blog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ error: 'Server error updating blog' });
  }
};

// Delete a blog
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Check if user is the author or admin
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this blog' });
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Server error deleting blog' });
  }
};

// Like a blog
const likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const alreadyLiked = blog.likes.includes(req.user.id);

    if (alreadyLiked) {
      // Unlike
      blog.likes = blog.likes.filter(id => id.toString() !== req.user.id);
      blog.likeCount = Math.max(0, blog.likeCount - 1);
    } else {
      // Like
      blog.likes.push(req.user.id);
      blog.likeCount += 1;
    }

    await blog.save();

    res.json({
      message: alreadyLiked ? 'Blog unliked' : 'Blog liked',
      likeCount: blog.likeCount,
      liked: !alreadyLiked
    });
  } catch (error) {
    console.error('Like blog error:', error);
    res.status(500).json({ error: 'Server error liking blog' });
  }
};

// Add a comment to a blog
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const comment = {
      user: req.user.id,
      userName: user.username,
      userAvatar: user.avatar,
      content: content.trim(),
      createdAt: new Date()
    };

    blog.comments.push(comment);
    blog.commentCount += 1;

    await blog.save();

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Server error adding comment' });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    
    const blog = await Blog.findById(blogId);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const comment = blog.comments.id(commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user is the comment author or admin
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    blog.comments = blog.comments.filter(c => c._id.toString() !== commentId);
    blog.commentCount = Math.max(0, blog.commentCount - 1);

    await blog.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Server error deleting comment' });
  }
};

// Get featured blogs
const getFeaturedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ 
      status: 'published',
      isFeatured: true 
    })
    .populate('author', 'username avatar')
    .sort('-createdAt')
    .limit(5);

    res.json({ blogs });
  } catch (error) {
    console.error('Get featured blogs error:', error);
    res.status(500).json({ error: 'Server error fetching featured blogs' });
  }
};

// Get blog statistics
const getBlogStats = async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments({ author: req.user.id });
    const publishedBlogs = await Blog.countDocuments({ 
      author: req.user.id, 
      status: 'published' 
    });
    const draftBlogs = await Blog.countDocuments({ 
      author: req.user.id, 
      status: 'draft' 
    });
    const totalLikes = await Blog.aggregate([
      { $match: { author: req.user.id } },
      { $group: { _id: null, total: { $sum: '$likeCount' } } }
    ]);

    res.json({
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalLikes: totalLikes[0]?.total || 0
    });
  } catch (error) {
    console.error('Get blog stats error:', error);
    res.status(500).json({ error: 'Server error fetching blog stats' });
  }
};

// Admin: Get all blogs (including unpublished)
const adminGetAllBlogs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 20, status, author } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (author) {
      query.author = author;
    }

    const blogs = await Blog.find(query)
      .populate('author', 'username email')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * 1);

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Admin get all blogs error:', error);
    res.status(500).json({ error: 'Server error fetching blogs' });
  }
};

// Admin: Toggle featured status
const adminToggleFeatured = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    blog.isFeatured = !blog.isFeatured;
    await blog.save();

    res.json({
      message: `Blog ${blog.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      blog
    });
  } catch (error) {
    console.error('Admin toggle featured error:', error);
    res.status(500).json({ error: 'Server error toggling featured status' });
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogById,
  getUserBlogs,
  updateBlog,
  deleteBlog,
  likeBlog,
  addComment,
  deleteComment,
  getFeaturedBlogs,
  getBlogStats,
  adminGetAllBlogs,
  adminToggleFeatured,
  upload
};
