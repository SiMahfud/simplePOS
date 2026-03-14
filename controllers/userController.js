const db = require('../database.js');
const bcrypt = require('bcryptjs');

exports.getUsers = (req, res) => {
    const sql = "SELECT id, username FROM users";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).send("Error fetching users");
            return;
        }
        res.render('users', { 
            user: req.session.user, 
            users: rows, 
            active: 'users',
            message: req.session.message
        });
        req.session.message = null; // Clear message
    });
};

exports.addUser = (req, res) => {
    const { username, password } = req.body;
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            req.session.message = { type: 'danger', text: 'Error hashing password.' };
            return res.redirect('/users');
        }
        const sql = 'INSERT INTO users (username, password) VALUES (?,?)';
        db.run(sql, [username, hash], function(err) {
            if (err) {
                req.session.message = { type: 'danger', text: `Gagal menambahkan pengguna: ${err.message}` };
            } else {
                req.session.message = { type: 'success', text: 'Pengguna baru berhasil ditambahkan!' };
            }
            res.redirect('/users');
        });
    });
};

exports.editUser = (req, res) => {
    const { new_password } = req.body;
    const userId = req.params.id;
    const saltRounds = 10;
    bcrypt.hash(new_password, saltRounds, (err, hash) => {
        if (err) {
            req.session.message = { type: 'danger', text: 'Error hashing password.' };
            return res.redirect('/users');
        }
        const sql = 'UPDATE users SET password = ? WHERE id = ?';
        db.run(sql, [hash, userId], function(err) {
            if (err) {
                req.session.message = { type: 'danger', text: `Gagal mengubah password: ${err.message}` };
            } else {
                req.session.message = { type: 'success', text: 'Password berhasil diubah!' };
            }
            res.redirect('/users');
        });
    });
};

exports.deleteUser = (req, res) => {
    const userIdToDelete = req.params.id;
    if (parseInt(userIdToDelete, 10) === req.session.user.id) {
        req.session.message = { type: 'danger', text: 'Anda tidak dapat menghapus akun Anda sendiri.' };
        return res.redirect('/users');
    }

    const sql = 'DELETE FROM users WHERE id = ?';
    db.run(sql, [userIdToDelete], function(err) {
        if (err) {
            req.session.message = { type: 'danger', text: `Gagal menghapus pengguna: ${err.message}` };
        } else {
            req.session.message = { type: 'success', text: 'Pengguna berhasil dihapus.' };
        }
        res.redirect('/users');
    });
};