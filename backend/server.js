require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const auth = require('./routes/auth');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const TEST_EMAIL = 'test@example.com';
const TEST_PWD = 'Test@1234';

// --- Root / health route to avoid 404 at /
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Password Reset API is running. Use /api/auth for auth endpoints.'
  });
});

// Mount API routes
app.use('/api/auth', auth);

// --- Serve frontend build if it exists (optional)
const CLIENT_BUILD_PATH = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(CLIENT_BUILD_PATH)) {
  console.log('Detected frontend build. Serving static files from:', CLIENT_BUILD_PATH);
  app.use(express.static(CLIENT_BUILD_PATH));

  // For any other route not handled by API, serve index.html (SPA support)
  app.get('*', (req, res) => {
    res.sendFile(path.join(CLIENT_BUILD_PATH, 'index.html'));
  });
}

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
