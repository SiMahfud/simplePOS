const db = require('../database.js');

exports.getSettings = (req, res) => {
    res.render('settings', { 
        user: req.session.user, 
        active: 'settings',
        success_msg: req.session.success_msg,
        settings: res.locals.settings // Pass settings to the template
    });
    req.session.success_msg = null; // Clear message after displaying
};

exports.updateSettings = (req, res) => {
    const settingsToUpdate = req.body;
    // Handle checkbox: if 'tax_enabled' is not in the body, it means it was unchecked.
    if (!settingsToUpdate.hasOwnProperty('tax_enabled')) {
        settingsToUpdate.tax_enabled = 'false';
    } else {
        settingsToUpdate.tax_enabled = 'true';
    }

    const updatePromises = Object.entries(settingsToUpdate).map(([key, value]) => {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE settings SET value = ? WHERE key = ?`;
            db.run(sql, [value, key], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });

    Promise.all(updatePromises)
        .then(() => {
            req.session.success_msg = 'Pengaturan berhasil diperbarui!';
            res.redirect('/settings');
        })
        .catch(err => {
            console.error("Error updating settings:", err);
            res.status(500).send("Gagal memperbarui pengaturan.");
        });
};