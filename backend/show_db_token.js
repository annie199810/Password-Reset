
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB = process.env.DB_FILE || path.join(__dirname, 'users.sqlite');
console.log('Using DB:', DB);
const db = new sqlite3.Database(DB, (err) => {
  if (err) { console.error('Open DB error:', err); process.exit(1); }
});
db.all('SELECT id,email,reset_token,reset_expires FROM users', [], (err, rows) => {
  if (err) { console.error('Query error:', err); db.close(); process.exit(1); }
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
