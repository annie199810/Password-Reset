require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const app = express();


const localDataDir = path.join(__dirname, '..', 'data');
if (!process.env.DB_FILE) {
  try {
    if (!fs.existsSync(localDataDir)) fs.mkdirSync(localDataDir, { recursive: true });
  } catch (e) {
    console.warn('Could not create local data dir:', e);
  }
 
  process.env.DB_FILE = path.join(localDataDir, 'users.sqlite');
}

app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));
app.use('/api/auth', require('./routes/auth'));


const frontendBuild = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(frontendBuild));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).send({ error: 'Not found' });
  res.sendFile(path.join(frontendBuild, 'index.html'));
});
