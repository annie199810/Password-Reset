require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const auth = require('./routes/auth');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const TEST_EMAIL = 'test@example.com';
const TEST_PWD = 'Test@1234';

app.use('/api/auth', auth);

const PORT = process.env.PORT || 4000;

function startServer() {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

// Seed test user, then start server
db.get('SELECT * FROM users WHERE email = ?', [TEST_EMAIL], async (err, row) => {
  if (err) {
    console.error('DB error during seed check:', err);
    // continue and start server so app is available for debugging
    return startServer();
  }

  if (!row) {
    try {
      const hashed = await bcrypt.hash(TEST_PWD, 10);
      db.run('INSERT INTO users (id, email, password) VALUES (?, ?, ?)', [uuidv4(), TEST_EMAIL, hashed], (insertErr) => {
        if (insertErr) {
          console.error('Error seeding test user:', insertErr);
        } else {
          console.log(`Seeded test user: ${TEST_EMAIL} / ${TEST_PWD}`);
        }
        startServer();
      });
    } catch (hashErr) {
      console.error('Hashing error during seed:', hashErr);
      startServer();
    }
  } else {
    console.log('Test user already exists.');
    startServer();
  }
});
