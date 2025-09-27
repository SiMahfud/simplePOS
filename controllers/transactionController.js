const db = require('../database.js');

exports.getTransactions = (req, res) => {
    const sql = `SELECT * FROM transactions ORDER BY timestamp DESC`;
    db.all(sql, [], (err, transactions) => {
        if (err) {
            res.status(500).send("Error fetching transactions");
            return;
        }

        if (transactions.length === 0) {
            return res.render('transactions', {
                user: req.session.user,
                transactions: [],
                active: 'transactions'
            });
        }

        const transactionIds = transactions.map(t => t.id);
        const itemsSql = `
            SELECT ti.*, p.name 
            FROM transaction_items ti
            JOIN products p ON ti.product_id = p.id
            WHERE ti.transaction_id IN (${transactionIds.join(',')})
        `;

        db.all(itemsSql, [], (err, items) => {
            if (err) {
                res.status(500).send("Error fetching transaction items");
                return;
            }

            const transactionsWithItems = transactions.map(transaction => ({
                ...transaction,
                items: items.filter(item => item.transaction_id === transaction.id)
            }));

            res.render('transactions', {
                user: req.session.user,
                transactions: transactionsWithItems,
                active: 'transactions'
            });
        });
    });
};

exports.getTransactionDetail = (req, res) => {
    const transactionId = req.params.id;
    const transactionSql = "SELECT * FROM transactions WHERE id = ?";

    db.get(transactionSql, [transactionId], (err, transaction) => {
        if (err) {
            return res.status(500).send("Error fetching transaction");
        }
        if (!transaction) {
            return res.status(404).send("Transaction not found");
        }

        const itemsSql = `
            SELECT ti.*, p.name, p.image_url
            FROM transaction_items ti
            JOIN products p ON ti.product_id = p.id
            WHERE ti.transaction_id = ?
        `;

        db.all(itemsSql, [transactionId], (err, items) => {
            if (err) {
                return res.status(500).send("Error fetching transaction items");
            }

            res.render('transaction-detail', {
                user: req.session.user,
                transaction: { ...transaction, items },
                active: 'transactions'
            });
        });
    });
};

exports.createTransaction = (req, res) => {
    const { cart, total } = req.body;

    if (!cart || cart.length === 0 || !total) {
        return res.status(400).json({ error: 'Invalid transaction data.' });
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        const transactionSql = `INSERT INTO transactions (total_amount, timestamp) VALUES (?, datetime('now','localtime'))`;
        db.run(transactionSql, [total], function(err) {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: `Failed to create transaction: ${err.message}` });
            }

            const transactionId = this.lastID;
            const itemPromises = cart.map(item => {
                return new Promise((resolve, reject) => {
                    const itemSql = 'INSERT INTO transaction_items (transaction_id, product_id, quantity, price_per_item) VALUES (?, ?, ?, ?)';
                    db.run(itemSql, [transactionId, item.id, item.quantity, item.price], (itemErr) => {
                        if (itemErr) return reject(itemErr);

                        const stockSql = 'UPDATE products SET stock = stock - ? WHERE id = ?';
                        db.run(stockSql, [item.quantity, item.id], (stockErr) => {
                            if (stockErr) return reject(stockErr);

                            const historySql = 'INSERT INTO stock_history (product_id, quantity_change, reason) VALUES (?, ?, ?)';
                            db.run(historySql, [item.id, -item.quantity, `sale:${transactionId}`], (historyErr) => {
                                if (historyErr) return reject(historyErr);
                                resolve();
                            });
                        });
                    });
                });
            });

            Promise.all(itemPromises)
                .then(() => {
                    db.run("COMMIT");
                    res.json({ success: true, transactionId: transactionId });
                })
                .catch(promiseErr => {
                    db.run("ROLLBACK");
                    res.status(500).json({ error: `Failed to process transaction items: ${promiseErr.message}` });
                });
        });
    });
};
