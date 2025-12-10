const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const router = express.Router();

const DB = process.env.DB_FILE || path.join(__dirname, "..", "users.sqlite");

router.get("/show-token", (req, res) => {
  const db = new sqlite3.Database(DB, (err) => {
    if (err) {
      return res.status(500).json({ error: "DB open failed" });
    }
  });

  db.all(
    "SELECT email, reset_token, reset_expires FROM users",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Query failed" });
      }
      res.json(rows);
      db.close();
    }
  );
});

module.exports = router;
