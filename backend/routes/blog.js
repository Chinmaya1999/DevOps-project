const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/blogController');
const { auth } = require('../middleware/auth');

// Public routes
router.get('/', getAllBlogs);
router.get('/featured', getFeaturedBlogs);
router.get('/:id', getBlogById);

// Protected routes
router.post('/', auth, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'pdfs', maxCount: 5 }]), createBlog);
router.get('/user/my-blogs', auth, getUserBlogs);
router.get('/user/stats', auth, getBlogStats);
router.put('/:id', auth, updateBlog);
router.delete('/:id', auth, deleteBlog);
router.put('/:id/like', auth, likeBlog);
router.post('/:id/comments', auth, addComment);
router.delete('/:blogId/comments/:commentId', auth, deleteComment);

// Admin routes
router.get('/admin/all', auth, adminGetAllBlogs);
router.put('/admin/:id/featured', auth, adminToggleFeatured);

module.exports = router;
