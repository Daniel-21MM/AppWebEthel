import express, { json } from 'express';
import { pool } from '../src/database/db.js';
import { PORT } from '../src/settings/config.js';

const app = express();


app.get('/', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM test");
    res.json(rows);
})

app.get('/ping', async (req, res) => {
    const [result] = await pool.query(`SELECT "hello world" as RESULT`);
    console.log(result);
    res.json(result[0]);
});

app.get('/create', async (req, res) => {
    const result = await pool.query('INSERT INTO test(name) VALUES ("Jonh")')
    res.json(result);
}
)

app.listen(PORT)
console.log('Server on port ', PORT);