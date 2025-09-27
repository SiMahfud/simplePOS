const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/users', isAuthenticated, userController.getUsers);
router.post('/users/add', isAuthenticated, userController.addUser);
router.post('/users/edit/:id', isAuthenticated, userController.editUser);
router.post('/users/delete/:id', isAuthenticated, userController.deleteUser);

module.exports = router;