
require('dotenv').config();
const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) =>
  res.json({ ok: true, env: process.env.NODE_ENV || 'development' })
);


app.use('/api/auth', require('./routes/auth'));


const frontendBuild = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(frontendBuild));

app.get('*', (req, res) => {

  if (req.path.startsWith('/api')) {
    return res.status(404).send({ error: 'Not found' });
  }
  res.sendFile(path.join(frontendBuild, 'index.html'));
});


async function seedTestUser() {
  return new Promise(async (resolve, reject) => {
    try {
      const dbFile = path.join(__dirname, 'users.sqlite');
      const db = new sqlite3.Database(dbFile, (err) => {
        if (err) {
          console.error('Failed to open DB for seeding:', err);
          
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
                    
                    resolve();
                  } else {
                    console.log(
                      `✅ Seeded ${seedEmail} (password: ${seedPassword}) — inserted=${this.changes}`
                    );
                    resolve();
                  }
                }
              );
            } catch (hashErr) {
              console.error('Seed: hashing error:', hashErr);
              resolve();
            } finally {
              
            }
          })();
        }
      );
    } catch (ex) {
      console.error('Unexpected seed error:', ex);
      resolve();
    }
  });
}


const port = process.env.PORT || 10000;


seedTestUser()
  .then(() => {
    app.listen(port, () => {
      console.log(
        `Server running on ${port} (NODE_ENV=${process.env.NODE_ENV || 'development'})`
      );
    });
  })
  .catch((err) => {
    console.error('Seed failed, starting server anyway:', err);
    app.listen(port, () => {
      console.log(
        `Server running on ${port} (NODE_ENV=${process.env.NODE_ENV || 'development'})`
      );
    });
  });
