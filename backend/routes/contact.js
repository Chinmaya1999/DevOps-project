const express = require('express');
const { submitContact } = require('../controllers/contactController');

const router = express.Router();

// Submit contact form
router.post('/', submitContact);

module.exports = router;
