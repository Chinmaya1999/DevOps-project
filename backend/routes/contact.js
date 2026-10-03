const express = require('express');
const { submitContact } = require('../controllers/contactController');

const { limiters } = require('../middleware/security');

const router = express.Router();

// Submit contact form
router.post('/', limiters.contact, submitContact);

module.exports = router;
