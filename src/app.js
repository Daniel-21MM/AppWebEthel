import express from 'express';
import router from './routes.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path'; 
import { PORT } from './config.js';
import ejs from 'ejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.set('view engine', 'ejs'); // Configura EJS como motor de plantillas
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true })); // Middleware para manejar datos de formularios

app.use(router);

// Agrega un mensaje de depuración para mostrar la ruta de las vistas
console.log('Ruta de las vistas:', path.join(__dirname, 'views'));

// Inicia el servidor
app.listen(PORT, () => {
  console.log('Server on port', PORT);
});

