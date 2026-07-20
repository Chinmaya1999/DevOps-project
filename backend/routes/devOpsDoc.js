const express = require('express');
const DevOpsDocController = require('../controllers/devOpsDocController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Public routes - anyone can view documentation
router.get('/', DevOpsDocController.getAllDocs);
router.get('/categories', DevOpsDocController.getCategories);
router.get('/technologies', DevOpsDocController.getTechnologies);
router.get('/:id', DevOpsDocController.getDocById);

// Admin routes - require authentication
router.use(auth);

router.post('/', DevOpsDocController.createDoc);
router.put('/:id', DevOpsDocController.updateDoc);
router.delete('/:id', DevOpsDocController.deleteDoc);

module.exports = router;
