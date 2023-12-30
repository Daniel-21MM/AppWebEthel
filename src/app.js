import express from 'express';
import { pool } from './db.js';
import { PORT } from './config.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsear el cuerpo de las solicitudes POST
app.use(express.urlencoded({ extended: true }));

// Ruta para la página de inicio de sesión
app.get('/login', (req, res) => {
  const loginPath = path.join(__dirname, 'views', 'login.html');
  res.sendFile(loginPath);
});

// Ruta para manejar el registro de un nuevo usuario (POST)
app.post('/register', async (req, res) => {
  try {
    const { usuario, contrasena, nombreCompleto, correo, rol } = req.body;

    // Verificar si el correo ya está registrado
    const cleanedEmail = correo.trim().toLowerCase();
    const existingUser = await pool.query('SELECT * FROM usuarios WHERE correo = ?', [cleanedEmail]);



    if (existingUser.length > 0) {
      return res.status(400).send('El correo ya está registrado');
    }

    // Hash de la contraseña antes de almacenarla en la base de datos
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Insertar el nuevo usuario en la base de datos
    await pool.query('INSERT INTO usuarios (usuario, contrasena, nombreCompleto, correo, rol) VALUES (?, ?, ?, ?, ?)', [usuario, hashedPassword, nombreCompleto, correo, rol]);

    res.send('Usuario registrado exitosamente');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});


// Ruta para manejar el inicio de sesión (POST)
app.post('/login', async (req, res) => {
  const { usuario, contrasena } = req.body;

  // Buscar el usuario en la base de datos
  const [result] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);

  if (result.length > 0) {
    // Verificar la contraseña utilizando bcrypt
    const hashedPassword = result[0].contrasena;
    const passwordMatch = await bcrypt.compare(contrasena, hashedPassword);

    if (passwordMatch) {
      // Si las credenciales son correctas, podrías redirigir a otra página o enviar un mensaje de éxito
      res.send('Inicio de sesión exitoso');
    } else {
      // Si las credenciales son incorrectas, podrías redirigir a otra página o enviar un mensaje de error
      res.send('Credenciales incorrectas');
    }
  } else {
    // Si el usuario no existe, podrías redirigir a otra página o enviar un mensaje de error
    res.send('Usuario no encontrado');
  }
});



app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'views', 'index.html');
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log('Server on port', PORT);
});
