const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'users.sqlite');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open DB:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  db.each("SELECT email, reset_token, reset_expires FROM users", (err, row) => {
    if (err) {
      console.error('Query error:', err.message);
      return;
    }
    console.log('EMAIL:', row.email);
    console.log('TOKEN:', row.reset_token);
    console.log('EXPIRES (ms since epoch):', row.reset_expires);
    console.log('Expires (human):', row.reset_expires ? new Date(row.reset_expires).toString() : 'none');
    console.log('---');
  }, () => {
    db.close();
  });
});
