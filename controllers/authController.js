const db = require('../database.js');
const bcrypt = require('bcrypt');

exports.getLogin = (req, res) => {
    res.render('login', { error: null });
};

exports.postLogin = (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ?";
    db.get(sql, [username], (err, row) => {
        if (err) {
            res.status(500).send("Error checking user");
            return;
        }
        if (row) {
            bcrypt.compare(password, row.password, (err, result) => {
                if (result) {
                    req.session.user = row;
                    res.redirect('/cashier');
                } else {
                    res.render('login', { error: 'Invalid password' });
                }
            });
        } else {
            res.render('login', { error: 'User not found' });
        }
    });
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/login');
};
