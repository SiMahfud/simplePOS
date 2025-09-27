require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const db = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

// Serve static files from the "public" directory
app.use(express.static('public'));

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Middleware to parse JSON bodies

// Middleware to load settings
app.use((req, res, next) => {
    const sql = "SELECT key, value FROM settings";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error fetching settings:", err);
            // Even if settings fail, continue without them
            res.locals.settings = {}; 
        } else {
            // Convert array of {key, value} to a single object
            res.locals.settings = rows.reduce((acc, setting) => {
                acc[setting.key] = setting.value;
                return acc;
            }, {});
        }
        next();
    });
});

const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');
const productRoutes = require('./routes/products');
const reportRoutes = require('./routes/reports');
const settingRoutes = require('./routes/settings');
const transactionRoutes = require('./routes/transactions');
const userRoutes = require('./routes/users');

app.use('/', authRoutes);
app.use('/', indexRoutes);
app.use('/', productRoutes);
app.use('/', reportRoutes);
app.use('/', settingRoutes);
app.use('/', transactionRoutes);
app.use('/', userRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});