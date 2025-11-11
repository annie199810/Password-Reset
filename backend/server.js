// backend/server.js - clean and simple

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();

// --- Global error logging (helpful on Render) ---
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err && err.stack ? err.stack : err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, p) => {
  console.error('UNHANDLED REJECTION:', reason && reason.stack ? reason.stack : reason);
});

// --- Basic middleware ---
const cors = require('cors');
app.use(cors()); // for demo it's fine; change options for production
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DB file: prefer process.env.DB_FILE, otherwise use ./data/users.sqlite ---
const appRoot = path.join(__dirname, '..');
const localDataDir = path.join(appRoot, 'data');

if (!process.env.DB_FILE) {
  if (!fs.existsSync(localDataDir)) {
    try { fs.mkdirSync(localDataDir, { recursive: true }); } catch (e) { /* ignore */ }
  }
  process.env.DB_FILE = path.join(localDataDir, 'users.sqlite');
}
const DB_FILE = process.env.DB_FILE;
console.log('Using DB file:', DB_FILE);

// --- Mount auth routes (ensure routes/auth.js uses process.env.DB_FILE too) ---
app.use('/api/auth', require('./routes/auth'));

// --- Serve frontend build if present ---
const frontendBuild = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).send({ error: 'Not found' });
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
} else {
  console.log('No frontend build found at', frontendBuild);
}

// --- Seed test user (runs at start, safe to call multiple times) ---
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

async function seedTestUser() {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(DB_FILE, (err) => {
      if (err) {
        console.error('Failed to open DB for seeding:', err);
        return resolve();
      }
    });

    db.run(
      `CREATE TABLE IF NOT EXISTS users (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         email TEXT UNIQUE,
         password TEXT,
         reset_token TEXT,
         reset_expires INTEGER
      )`,
      (createErr) => {
        if (createErr) {
          console.error('Create table error:', createErr);
          db.close();
          return resolve();
        }

        (async () => {
          try {
            const seedEmail = process.env.SEED_EMAIL || 'test@example.com';
            const seedPassword = process.env.SEED_PASSWORD || 'Test@1234';
            const hashed = await bcrypt.hash(seedPassword, 10);

            db.run(
              'INSERT OR IGNORE INTO users (email, password) VALUES (?, ?)',
              [seedEmail, hashed],
              function (insertErr) {
                if (insertErr) {
                  console.error('Seed insert error:', insertErr);
                } else {
                  console.log(`Seeded ${seedEmail} — inserted=${this.changes}`);
                }
                db.close();
                resolve();
              }
            );
          } catch (err) {
            console.error('Seed hashing error:', err);
            db.close();
            resolve();
          }
        })();
      }
    );
  });
}

// --- Start server ---
const PORT = Number(process.env.PORT) || 10000;

seedTestUser()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
    });
  })
  .catch((err) => {
    console.error('Seed failed, starting server anyway:', err);
    app.listen(PORT, () => {
      console.log(`Server listening on ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
    });
  });

module.exports = app;
