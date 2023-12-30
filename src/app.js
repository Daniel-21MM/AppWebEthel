import express from 'express';
import { pool } from './db.js';
import { PORT } from './config.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import bcrypt from 'bcrypt';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsear el cuerpo de las solicitudes POST
app.use(express.urlencoded({ extended: true }));

// Configuración de Multer
const storage = multer.memoryStorage(); // Almacenar los datos en memoria
const upload = multer({ storage: storage });

// Middleware para parsear el cuerpo de las solicitudes POST
app.use(upload.none());

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
    const [existingUser] = await pool.query('SELECT * FROM usuarios WHERE TRIM(correo) = TRIM(?)', [cleanedEmail]);

    console.log('Datos del formulario:', req.body);

    if (existingUser.length > 0) {
      console.log('Correo ya registrado:', existingUser);
      return res.status(400).send('El correo ya está registrado');
    }

    // Hash de la contraseña antes de almacenarla en la base de datos
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Insertar el nuevo usuario en la base de datos
    await pool.query('INSERT INTO usuarios (usuario, contrasena, nombreCompleto, correo, rol) VALUES (?, ?, ?, ?, ?)', [usuario, hashedPassword, nombreCompleto, correo, rol]);

    res.send('Usuario registrado exitosamente');
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).send('Error interno del servidor');
  }
});


app.post('/login', async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;
    const [result] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);

    console.log('Datos del formulario:', req.body);

    if (result.length > 0) {
      const hashedPassword = result[0].contrasena;
      const passwordMatch = await bcrypt.compare(contrasena, hashedPassword);

      if (passwordMatch) {
        // Si las credenciales son correctas, redirigir a la página principal
        res.redirect('/principal.html');
      } else {
        res.json({ success: false, message: 'Credenciales incorrectas' });
      }
    } else {
      res.json({ success: false, message: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.get('/principal.html', (req, res) => {
  const indexPath = path.join(__dirname, 'views', 'principal.html');
  res.sendFile(indexPath);
});



// Ruta para la página principal
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'views', 'index.html');
  res.sendFile(indexPath);
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log('Server on port', PORT);
});
