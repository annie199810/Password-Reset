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



db.get('SELECT * FROM users WHERE email = ?', [TEST_EMAIL], async (err, row) => {
if (!row) {
const hashed = await bcrypt.hash(TEST_PWD, 10);
db.run('INSERT INTO users (id, email, password) VALUES (?, ?, ?)', [uuidv4(), TEST_EMAIL, hashed]);
console.log(`Seeded test user: ${TEST_EMAIL} / ${TEST_PWD}`);
}
});


app.use('/api/auth', auth);


const port = process.env.PORT || 4000;
app.listen(port, () => console.log('Server running on', port));