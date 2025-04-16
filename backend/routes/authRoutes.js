const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Import the middleware
// Authentication Routes
router.post('/parent/signup', authController.parentSignup);
router.post('/parent/login', authController.parentLogin);
router.post('/child/login', authController.childLogin);
// router.post('/logout', protect, authController.logout); // Logout often handled client-side by deleting token
router.get('/me', protect, authController.getMe); // Protect the /me route

module.exports = router;
