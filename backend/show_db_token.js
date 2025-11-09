
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_FILE = path.join(__dirname, 'users.sqlite'); 
const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READONLY, (err) => {
  if (err) return console.error('Open DB error:', err.message);
});

const EMAIL = 'test@example.com';

db.get('SELECT id,email,reset_token,reset_expires FROM users WHERE email = ?', [EMAIL], (err, row) => {
  if (err) {
    console.error('Query error:', err);
    db.close();
    return;
  }
  if (!row) {
    console.log('No user found with email', EMAIL);
    db.close();
    return;
  }

  console.log('EMAIL:', row.email);
  console.log('TOKEN:', row.reset_token);
  console.log('EXPIRES (ms):', row.reset_expires);
  if (row.reset_expires) {
    console.log('Expires (human):', new Date(Number(row.reset_expires)).toString());
  } else {
    console.log('Expires (human): none');
  }
  db.close();
});
