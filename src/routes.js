// routes.js
import express from 'express';
import { pool } from './db.js';
import { hashPassword, comparePasswords } from './passwordUtils.js';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';


const router = express.Router();

// Ruta para la página de inicio de sesión
router.get('/login', (req, res) => {
    const loginPath = path.join(__dirname, 'views', 'login.html');
    res.sendFile(loginPath);
});

// Ruta para manejar el registro de un nuevo usuario (POST)
router.post('/register', async (req, res) => {
    try {
        const { usuario, contrasena, nombreCompleto, correo, rol } = req.body;

        // Verificar si el correo ya está registrado
        const cleanedEmail = correo.trim().toLowerCase();
        const [existingUser] = await pool.query('SELECT * FROM usuarios WHERE TRIM(correo) = TRIM(?)', [cleanedEmail]);

        // console.log('Datos del formulario:', req.body);

        if (existingUser.length > 0) {
            console.log('Correo ya registrado:', existingUser);
            return res.status(400).json({ success: false, message: '¡El correo ya está registrado!' });
        }

        // Hash de la contraseña antes de almacenarla en la base de datos
        const hashedPassword = await bcrypt.hash(contrasena, 10);

        // Insertar el nuevo usuario en la base de datos
        await pool.query('INSERT INTO usuarios (usuario, contrasena, nombreCompleto, correo, rol) VALUES (?, ?, ?, ?, ?)', [usuario, hashedPassword, nombreCompleto, correo, rol]);

        // Enviar una respuesta JSON indicando éxito sin redirección
        res.json({ success: true, message: `¡Bienvenido ${usuario}!` });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});


// Ruta para el inicio de sesión (POST)
router.post('/login', async (req, res) => {
    try {
        const { usuario, contrasena } = req.body;
        const [result] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);

        // console.log('Datos del formulario:', req.body);

        if (result.length > 0) {
            const hashedPassword = result[0].contrasena;
            const passwordMatch = await bcrypt.compare(contrasena, hashedPassword);

            if (passwordMatch) {
                // Si las credenciales son correctas, enviar una respuesta JSON con éxito y el nombre de usuario
                res.json({ success: true, message: `¡Bienvenido ${result[0].usuario}!`, redirect: '/principal.html' });
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

// Ruta para la página principal
router.get('/principal.html', (req, res) => {
    const indexPath = path.join(__dirname, 'views', 'principal.html');
    res.sendFile(indexPath);
});

// Ruta para la página principal
router.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'views', 'index.html');
    res.sendFile(indexPath);
});

// Reorganiza el código de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'docs'); // Carpeta donde se guardarán los archivos
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
    },
});

const upload = multer({ storage: storage });

router.post('/guardarCurso', upload.single('archivoCurso'), (req, res) => {
    try {
        console.log('Entrando en /guardarCurso');
        // Obtener datos del formulario
        const { nombreCurso, tipoCurso, duracionCurso, fechaInicio, instructor, tipoInstitucion } = req.body;

        // Obtener ruta del archivo subido
        const documentPath = req.file ? req.file.path : null;

        console.log('Datos del formulario:', req.body);
        console.log('Ruta del documento:', documentPath);

        if (!documentPath) {
            console.log('Error: No se ha subido el archivo correctamente.');
            return res.status(400).json({ success: false, message: 'Error: No se ha subido el archivo correctamente.' });
        }

        // Insertar datos en la base de datos
        pool.query(
            'INSERT INTO cursos (nombreCurso, TipoCurso, DuracionCurso, FechaInicio, Instructor, Lugar, DocumentPath) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombreCurso, tipoCurso, duracionCurso, fechaInicio, instructor, tipoInstitucion, documentPath],
            (error, results) => {
                if (error) {
                    console.error('Error al insertar en la base de datos:', error);
                    res.status(500).json({ success: false, message: 'Error interno del servidor' });
                } else {
                    console.log('Curso guardado correctamente');
                    // Cambia el bloque res.json en /guardarCurso
                    res.json({ success: true, message: 'Curso guardado correctamente', redirect: '/principal.html' });

                    // Puedes omitir res.end() ya que res.json() cierra la conexión automáticamente
                }
            }
        );
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});


export default router;
