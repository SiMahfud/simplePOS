const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const DBSOURCE = "simplepos.db";

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => {
            // Users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE, 
                password TEXT
            )`, (err) => {
                if (err) {
                    console.error("Error creating users table", err);
                } else {
                    // Add a default user if table is new
                    const saltRounds = 10;
                    bcrypt.hash('belajarlah', saltRounds, (err, hash) => {
                        if (err) {
                            console.error("Error hashing password:", err);
                            return;
                        }
                        const insert = 'INSERT OR IGNORE INTO users (username, password) VALUES (?,?)';
                        db.run(insert, ['admin', hash]);
                    });
                }
            });

            // Products table
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                sku TEXT UNIQUE,
                stock INTEGER DEFAULT 0,
                image_url TEXT,
                harga_modal REAL NOT NULL DEFAULT 0
            )`, (err) => {
                if (err) {
                    console.error("Error creating products table", err);
                } else {
                    // Seed products
                    const insert = 'INSERT OR IGNORE INTO products (name, price, sku, stock, image_url, harga_modal) VALUES (?,?,?,?,?,?)';
                    db.run(insert, ["Kopi Susu", 18000, "KS-001", 100, "", 12000]);
                }
            });

            // Transactions table
            db.run(`CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                total_amount REAL NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error("Error creating transactions table", err);
                }
            });

            // Transaction items table
            db.run(`CREATE TABLE IF NOT EXISTS transaction_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id INTEGER,
                product_id INTEGER,
                quantity INTEGER NOT NULL,
                price_per_item REAL NOT NULL,
                FOREIGN KEY (transaction_id) REFERENCES transactions(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )`, (err) => {
                if (err) {
                    console.error("Error creating transaction_items table", err);
                }
            });

            // Stock History table
            db.run(`CREATE TABLE IF NOT EXISTS stock_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER,
                quantity_change INTEGER NOT NULL,
                reason TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id)
            )`);

            // Settings table
            db.run(`CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE,
                value TEXT
            )`, (err) => {
                if (err) {
                    console.error("Error creating settings table", err);
                } else {
                    const settings = [
                        { key: 'store_name', value: 'Simple POS' },
                        { key: 'store_address', value: 'Jalan Jenderal Sudirman No. 1' },
                        { key: 'store_phone', value: '081234567890' },
                        { key: 'currency_symbol', value: 'Rp' },
                        { key: 'tax_percentage', value: '11' },
                        { key: 'tax_enabled', value: 'true' },
                        { key: 'theme', value: 'light' }
                    ];
                    const insert = 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)';
                    settings.forEach(setting => db.run(insert, [setting.key, setting.value]));
                }
            });
        });
    }
});

module.exports = db;