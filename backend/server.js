
require('dotenv').config();
const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));


app.use('/api/auth', require('./routes/auth'));


const frontendBuild = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(frontendBuild));


app.get('*', (req, res) => {
 
  if (req.path.startsWith('/api')) {
    return res.status(404).send({ error: 'Not found' });
  }
  res.sendFile(path.join(frontendBuild, 'index.html'));
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server running on ${port} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
});
