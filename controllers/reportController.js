const db = require('../database.js');

exports.getSalesByProduct = (req, res) => {
    let { startDate, endDate } = req.query;

    // Default to today if no date range is provided
    if (!startDate || !endDate) {
        const today = new Date();
        startDate = today.toISOString().slice(0, 10);
        endDate = startDate;
    }

    const sql = `
        SELECT 
            p.sku,
            p.name,
            SUM(ti.quantity) as total_quantity_sold,
            SUM(ti.quantity * ti.price_per_item) as total_revenue,
            SUM(ti.quantity * (p.price - p.harga_modal)) as total_profit
        FROM transaction_items ti
        JOIN transactions t ON ti.transaction_id = t.id
        JOIN products p ON ti.product_id = p.id
        WHERE date(t.timestamp) BETWEEN ? AND ?
        GROUP BY p.id, p.name, p.sku, p.harga_modal
        ORDER BY total_revenue DESC
    `;

    db.all(sql, [startDate, endDate], (err, rows) => {
        if (err) {
            console.error("Error fetching product sales data:", err);
            return res.status(500).send("Error fetching report data.");
        }

        res.render('reports/sales-by-product', {
            user: req.session.user,
            productSales: rows,
            startDate,
            endDate,
            active: 'reports' // for navbar highlighting
        });
    });
};

exports.getStockReport = (req, res) => {
    const sql = `
        SELECT sku, name, stock
        FROM products
        ORDER BY name ASC
    `;

    db.all(sql, [], (err, products) => {
        if (err) {
            console.error("Error fetching stock report data:", err);
            return res.status(500).send("Error fetching report data.");
        }

        res.render('reports/stock-report', {
            user: req.session.user,
            products,
            active: 'reports' // for navbar highlighting
        });
    });
};
