
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();


process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err && err.stack ? err.stack : err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason && reason.stack ? reason.stack : reason);
});


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'users.sqlite');

try {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.openSync(DB_FILE, 'a');
} catch (e) {
  console.warn('Could not ensure DB file exists:', e && e.message ? e.message : e);
}
console.log('Using DB file:', DB_FILE);


process.env.DB_FILE = DB_FILE;


app.use('/api/auth', require('./routes/auth'));


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
          console.error('Seed: create table error:', createErr);
          try { db.close(); } catch(_) {}
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
                  console.error('Seed: insert error:', insertErr);
                } else {
                  console.log(`✅ Seeded ${seedEmail} — inserted=${this.changes}`);
                }
                try { db.close(); } catch(_) {}
                resolve();
              }
            );
          } catch (hashErr) {
            console.error('Seed: hashing error:', hashErr);
            try { db.close(); } catch(_) {}
            resolve();
          }
        })();
      }
    );
  });
}

const PORT = Number(process.env.PORT) || 10000;

seedTestUser()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
    });
  })
  .catch((err) => {
    console.error('Seed failed, starting server anyway:', err);
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
    });
  });

module.exports = app;
