import express from 'express';
import { pool } from './db.js';
import { PORT } from './config.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import path from 'path';

const app = express();

// Configuración para servir archivos estáticos desde la carpeta "views"
app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'views', 'index.html');
  res.sendFile(indexPath);
});

app.get('/ping', async (req, res) => {
  const [result] = await pool.query(`SELECT "hello world" as RESULT`);
  res.json(result[0]);
});

// app.get('/create', async (req, res) => {
//   const result = await pool.query('INSERT INTO test(name) VALUES ("John")');
//   res.json(result);
// });

app.listen(PORT, () => {
  console.log('Server on port', PORT);
});
