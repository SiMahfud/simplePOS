const db = require('../database.js');

exports.getRoot = (req, res) => {
    res.redirect('/cashier');
};

exports.getStatistics = (req, res) => {
    let { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        const today = new Date();
        startDate = today.toISOString().slice(0, 10);
        endDate = startDate;
    }

    const queries = [
        // 0: Total Sales
        new Promise((resolve, reject) => {
            const sql = `SELECT SUM(total_amount) AS total FROM transactions WHERE date(timestamp) BETWEEN ? AND ?`;
            db.get(sql, [startDate, endDate], (err, row) => err ? reject(err) : resolve(row.total || 0));
        }),
        // 1: Total Transactions
        new Promise((resolve, reject) => {
            const sql = `SELECT COUNT(id) AS count FROM transactions WHERE date(timestamp) BETWEEN ? AND ?`;
            db.get(sql, [startDate, endDate], (err, row) => err ? reject(err) : resolve(row.count || 0));
        }),
        // 2: Total Items Sold
        new Promise((resolve, reject) => {
            const sql = `SELECT SUM(ti.quantity) AS total FROM transaction_items ti JOIN transactions t ON ti.transaction_id = t.id WHERE date(t.timestamp) BETWEEN ? AND ?`;
            db.get(sql, [startDate, endDate], (err, row) => err ? reject(err) : resolve(row.total || 0));
        }),
        // 3: Top 5 Products
        new Promise((resolve, reject) => {
            const sql = `SELECT p.name, SUM(ti.quantity) as total_sold FROM transaction_items ti JOIN products p ON ti.product_id = p.id JOIN transactions t ON ti.transaction_id = t.id WHERE date(t.timestamp) BETWEEN ? AND ? GROUP BY p.name ORDER BY total_sold DESC LIMIT 5`;
            db.all(sql, [startDate, endDate], (err, rows) => err ? reject(err) : resolve(rows));
        }),
        // 4: Recent 5 Transactions
        new Promise((resolve, reject) => {
            const sql = `SELECT * FROM transactions WHERE date(timestamp) BETWEEN ? AND ? ORDER BY timestamp DESC LIMIT 5`;
            db.all(sql, [startDate, endDate], (err, rows) => err ? reject(err) : resolve(rows));
        })
    ];

    Promise.all(queries).then(([salesInRange, transactionsInRange, itemsSoldInRange, topProducts, recentTransactions]) => {
        res.render('statistics', {
            user: req.session.user,
            salesInRange,
            transactionsInRange,
            itemsSoldInRange,
            topProducts,
            recentTransactions,
            customersInRange: 0, // Placeholder for now
            startDate,
            endDate,
            active: 'statistics'
        });
    }).catch(err => {
        console.error("Error fetching statistics data:", err);
        res.status(500).send("Error fetching statistics data");
    });
};

exports.getCashier = (req, res) => {
    const lowStockSql = "SELECT name, stock FROM products WHERE stock <= 10 AND stock > 0 ORDER BY stock ASC";
    db.all(lowStockSql, [], (err, lowStockProducts) => {
        if (err) {
            console.error("Error fetching low stock products:", err);
            // Non-critical error, so we still render the page
            res.render('cashier', { user: req.session.user, active: 'cashier', lowStockProducts: [] });
        } else {
            res.render('cashier', { 
                user: req.session.user, 
                active: 'cashier', 
                lowStockProducts 
            });
        }
    });
};

exports.getProductBySku = (req, res) => {
    const { sku } = req.params;
    const sql = "SELECT * FROM products WHERE sku = ?";
    db.get(sql, [sku], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Product not found" });
        }
        if (row.stock <= 0) {
            return res.status(400).json({ error: "Product out of stock" });
        }
        res.json(row);
    });
};

exports.searchProducts = (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ error: "Query parameter 'q' is required." });
    }
    const sql = "SELECT * FROM products WHERE name LIKE ? LIMIT 10";
    db.all(sql, [`%${q}%`], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
};
