const express = require('express');
const router = express.Router();
const {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCategories,
  getProviders,
  getDashboardStats
} = require('../controllers/terraformTemplateController');
const { auth: protect, adminAuth: admin } = require('../middleware/auth');

// Public routes
router.get('/', getAllTemplates);
router.get('/categories', getCategories);
router.get('/providers', getProviders);

// Admin only routes
router.get('/admin/dashboard', protect, admin, getDashboardStats);
router.post('/', protect, admin, createTemplate);
router.put('/:id', protect, admin, updateTemplate);
router.delete('/:id', protect, admin, deleteTemplate);
router.get('/:id', getTemplateById);

module.exports = router;
