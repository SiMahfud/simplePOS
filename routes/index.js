const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, indexController.getRoot);
router.get('/statistics', isAuthenticated, indexController.getStatistics);
router.get('/cashier', isAuthenticated, indexController.getCashier);
router.get('/api/products/sku/:sku', isAuthenticated, indexController.getProductBySku);
router.get('/api/products/search', isAuthenticated, indexController.searchProducts);

module.exports = router;
