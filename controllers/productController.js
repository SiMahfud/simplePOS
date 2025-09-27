const db = require('../database.js');
const fs = require('fs');
const path = require('path');

exports.getProducts = (req, res) => {
    const sql = "SELECT * FROM products ORDER BY name ASC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).send("Error fetching products");
            return;
        }
        res.render('products', { 
            user: req.session.user, 
            products: rows, 
            message: req.session.message, 
            active: 'products'
        });
        req.session.message = null; // Clear message after displaying
    });
};

exports.addProduct = (req, res) => {
    const { name, price, sku, stock, harga_modal } = req.body;
    const imageUrl = req.file ? '/uploads/' + req.file.filename : null;

    const sql = 'INSERT INTO products (name, price, sku, stock, image_url, harga_modal) VALUES (?,?,?,?,?,?)';
    db.run(sql, [name, price, sku, stock, imageUrl, harga_modal], function(err) {
        if (err) {
            req.session.message = `Error adding product: ${err.message}`;
            res.redirect('/products');
        } else {
            const productId = this.lastID;
            const historySql = 'INSERT INTO stock_history (product_id, quantity_change, reason) VALUES (?, ?, ?)';
            db.run(historySql, [productId, stock, 'initial'], (historyErr) => {
                if (historyErr) {
                    req.session.message = 'Product added, but failed to log stock history.';
                } else {
                    req.session.message = 'Product successfully added!';
                }
                res.redirect('/products');
            });
        }
    });
};

exports.editProduct = (req, res) => {
    const { name, price, sku, stock, harga_modal } = req.body;
    const productId = req.params.id;

    db.get('SELECT image_url, stock FROM products WHERE id = ?', [productId], (err, product) => {
        if (err) {
            req.session.message = `Error finding product: ${err.message}`;
            return res.redirect('/products');
        }
        if (!product) {
            req.session.message = 'Product not found.';
            return res.redirect('/products');
        }

        const oldImageUrl = product.image_url;
        const newImageUrl = req.file ? '/uploads/' + req.file.filename : oldImageUrl;
        const stockChange = stock - product.stock;

        const sql = 'UPDATE products SET name = ?, price = ?, sku = ?, stock = ?, image_url = ?, harga_modal = ? WHERE id = ?';
        db.run(sql, [name, price, sku, stock, newImageUrl, harga_modal, productId], function(err) {
            if (err) {
                req.session.message = `Error updating product: ${err.message}`;
                res.redirect('/products');
            } else {
                if (stockChange !== 0) {
                    const historySql = 'INSERT INTO stock_history (product_id, quantity_change, reason) VALUES (?, ?, ?)';
                    db.run(historySql, [productId, stockChange, 'adjustment (edit)'], (historyErr) => {
                        if (historyErr) console.error("Failed to log stock history on edit");
                    });
                }

                if (req.file && oldImageUrl) {
                    fs.unlink(path.join(__dirname, '../public', oldImageUrl), (unlinkErr) => {
                        if (unlinkErr) console.error("Error deleting old image:", unlinkErr);
                    });
                }
                req.session.message = 'Product successfully updated!';
                res.redirect('/products');
            }
        });
    });
};

exports.deleteProduct = (req, res) => {
    const productId = req.params.id;
    db.get('SELECT image_url FROM products WHERE id = ?', [productId], (err, row) => {
        if (err) {
            req.session.message = `Error finding product: ${err.message}`;
            return res.redirect('/products');
        }
        const imageUrl = row ? row.image_url : null;
        const sql = 'DELETE FROM products WHERE id = ?';
        db.run(sql, [productId], function(err) {
            if (err) {
                req.session.message = `Error deleting product: ${err.message}`;
            } else {
                if (imageUrl) {
                    fs.unlink(path.join(__dirname, '../public', imageUrl), (unlinkErr) => {
                        if (unlinkErr) console.error("Error deleting image file:", unlinkErr);
                    });
                }
                req.session.message = 'Product successfully deleted!';
            }
            res.redirect('/products');
        });
    });
};

exports.getStockAdjustment = (req, res) => {
    db.all("SELECT id, name, stock FROM products ORDER BY name ASC", [], (err, products) => {
        if (err) {
            res.status(500).send("Error fetching products");
            return;
        }
        res.render('stock-adjustment', { 
            user: req.session.user, 
            products: products, 
            message: req.session.message, 
            active: 'products'
        });
        req.session.message = null;
    });
};

exports.postStockAdjustment = (req, res) => {
    const { product_id, new_stock, reason } = req.body;

    db.get('SELECT stock FROM products WHERE id = ?', [product_id], (err, product) => {
        if (err || !product) {
            req.session.message = { type: 'danger', text: 'Produk tidak ditemukan.' };
            return res.redirect('/stock-adjustment');
        }

        const oldStock = product.stock;
        const quantityChange = new_stock - oldStock;

        if (quantityChange === 0) {
            req.session.message = { type: 'info', text: 'Tidak ada perubahan stok.' };
            return res.redirect('/stock-adjustment');
        }

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            const updateSql = 'UPDATE products SET stock = ? WHERE id = ?';
            db.run(updateSql, [new_stock, product_id], function(err) {
                if (err) {
                    db.run("ROLLBACK");
                    req.session.message = { type: 'danger', text: 'Gagal memperbarui stok produk.' };
                    return res.redirect('/stock-adjustment');
                }

                const historySql = 'INSERT INTO stock_history (product_id, quantity_change, reason) VALUES (?, ?, ?)';
                db.run(historySql, [product_id, quantityChange, reason], (historyErr) => {
                    if (historyErr) {
                        db.run("ROLLBACK");
                        req.session.message = { type: 'danger', text: 'Gagal mencatat riwayat stok.' };
                        return res.redirect('/stock-adjustment');
                    }

                    db.run("COMMIT");
                    req.session.message = { type: 'success', text: 'Stok berhasil disesuaikan.' };
                    res.redirect('/stock-adjustment');
                });
            });
        });
    });
};

exports.getStockHistory = (req, res) => {
    const productId = req.params.id;
    const productSql = "SELECT id, name FROM products WHERE id = ?";
    db.get(productSql, [productId], (err, product) => {
        if (err || !product) {
            res.status(404).send("Product not found");
            return;
        }

        const historySql = "SELECT * FROM stock_history WHERE product_id = ? ORDER BY timestamp DESC";
        db.all(historySql, [productId], (err, history) => {
            if (err) {
                res.status(500).send("Error fetching stock history");
                return;
            }
            res.render('stock-history', {
                user: req.session.user,
                product: product,
                history: history,
                active: 'products'
            });
        });
    });
};