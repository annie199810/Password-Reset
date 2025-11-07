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


app.set('trust proxy', true); 
app.use(cors());
app.use(bodyParser.json());


app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});


app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Password Reset API is running. Use /api/auth for auth endpoints.'
  });
});


app.use('/api/auth', auth);


const CLIENT_BUILD_PATH = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(CLIENT_BUILD_PATH)) {
  console.log('Detected frontend build. Serving static files from:', CLIENT_BUILD_PATH);
  app.use(express.static(CLIENT_BUILD_PATH));

  
  app.get('*', (req, res) => {
    
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(CLIENT_BUILD_PATH, 'index.html'));
  });
}

const TEST_EMAIL = 'test@example.com';
const TEST_PWD = 'Test@1234';

const PORT = process.env.PORT || 4000;
let server = null;
let started = false;

function startServer() {
  if (started) return;
  started = true;

  server = app.listen(PORT, () => {
    console.log(`Server running on ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  });

  const shutdown = (sig) => {
    console.log(`Received ${sig} — closing server...`);
    if (server) {
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
   
      setTimeout(() => {
        console.warn('Forcing shutdown.');
        process.exit(1);
      }, 10000).unref();
    } else {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));


  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err && (err.stack || err));
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason && (reason.stack || reason));
  });
}


db.get('SELECT * FROM users WHERE email = ?', [TEST_EMAIL], async (err, row) => {
  if (err) {
    console.error('DB error during seed check:', err);
    
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
