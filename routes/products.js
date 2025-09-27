const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

router.get('/products', isAuthenticated, productController.getProducts);
router.post('/products/add', isAuthenticated, upload.single('image'), productController.addProduct);
router.post('/products/edit/:id', isAuthenticated, upload.single('image'), productController.editProduct);
router.post('/products/delete/:id', isAuthenticated, productController.deleteProduct);
router.get('/stock-adjustment', isAuthenticated, productController.getStockAdjustment);
router.post('/stock-adjustment', isAuthenticated, productController.postStockAdjustment);
router.get('/stock-history/:id', isAuthenticated, productController.getStockHistory);

module.exports = router;