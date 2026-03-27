const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Eroare la conectarea la DB:', err);
        return;
    }
    console.log('Conectat la MySQL!');
});

app.get('/', (req, res) => {
    res.send('Backend-ul iTECify funcționează! 🚀');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Serverul rulează pe portul ${PORT}`);
});