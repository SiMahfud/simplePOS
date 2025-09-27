const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/reports/sales-by-product', isAuthenticated, reportController.getSalesByProduct);
router.get('/reports/stock-report', isAuthenticated, reportController.getStockReport);

module.exports = router;
