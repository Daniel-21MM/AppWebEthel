// app.js
import express from 'express';
import router from './routes.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path'; 
import { PORT } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(router);

// Inicia el servidor
app.listen(PORT, () => {
  console.log('Server on port', PORT);
});
