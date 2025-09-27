const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/settings', isAuthenticated, settingController.getSettings);
router.post('/settings', isAuthenticated, settingController.updateSettings);

module.exports = router;