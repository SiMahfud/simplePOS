const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/transactions', isAuthenticated, transactionController.getTransactions);
router.get('/transactions/:id', isAuthenticated, transactionController.getTransactionDetail);
router.post('/transactions/create', isAuthenticated, transactionController.createTransaction);

module.exports = router;
