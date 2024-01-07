import express from 'express';
import { pool } from './db.js';
import bcrypt from 'bcrypt';


const router = express.Router();

// Ruta para la página de inicio de sesión
router.get('/login', (req, res) => {
    res.render('login');
});
// Ruta para la página de inicio de sesión
router.get('/register', (req, res) => {
    res.render('register');
});

// Ruta para la página principal (utilizando principal.ejs)
router.get('/principal', (req, res) => {
    res.render('principal');
});

// Ruta para manejar el registro de un nuevo usuario (POST)
router.post('/register', async (req, res) => {
    try {
        const { usuario, contrasena, nombreCompleto, correo, rol } = req.body;

        // Verificar si el correo ya está registrado
        const cleanedEmail = correo.trim().toLowerCase();
        const [existingUser] = await pool.query('SELECT * FROM usuarios WHERE TRIM(correo) = TRIM(?)', [cleanedEmail]);

        if (existingUser.length > 0) {
            console.log('Correo ya registrado:', existingUser);
            return res.render('register', { success: false, message: '¡El correo ya está registrado!' });
        }

        // Hash de la contraseña antes de almacenarla en la base de datos
        const hashedPassword = await bcrypt.hash(contrasena, 10);

        // Insertar el nuevo usuario en la base de datos
        await pool.query('INSERT INTO usuarios (usuario, contrasena, nombreCompleto, correo, rol) VALUES (?, ?, ?, ?, ?)', [usuario, hashedPassword, nombreCompleto, correo, rol]);

        // Enviar una respuesta renderizada indicando éxito sin redirección
        res.render('register', { success: true, message: `¡Bienvenido ${usuario}!` });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// Ruta para el inicio de sesión (POST)
router.post('/login', async (req, res) => {
    try {
        console.log(req.body);
        const { usuario, contrasena } = req.body;
        const [result] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);

        if (result.length > 0) {
            const hashedPassword = result[0].contrasena;
            const passwordMatch = await bcrypt.compare(contrasena, hashedPassword);

            if (passwordMatch) {
                res.render('index', { success: true, message: `¡Bienvenido ${result[0].usuario}!`, redirect: '/principal' });

            } else {
                res.render('index', { success: false, message: '¡Credenciales incorrectas!' });
            }
        } else {
            res.render('index', { success: false, message: '¡Usuario no registrado!' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// Ruta para manejar el formulario de cursos (POST)
router.post('/guardarCurso', async (req, res) => {
    try {
        const {
            nombreCurso,
            tipoCurso,
            duracionCurso,
            fechaInicio,
            instructor,
            tipoInstitucion,
            archivoCurso,
        } = req.body;

        // Convierte el archivo PDF de base64 a un Buffer
        const documentPath = Buffer.from(archivoCurso, 'base64');

        // Insertar el nuevo curso en la base de datos
        await pool.query(
            'INSERT INTO cursos (nombreCurso, TipoCurso, DuracionCurso, FechaInicio, Instructor, Lugar, DocumentPath) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombreCurso, tipoCurso, duracionCurso, fechaInicio, instructor, tipoInstitucion, documentPath]
        );


        // Después de guardar el curso exitosamente
        res.redirect('/principal?success=true&message=¡Curso guardado exitosamente!');
    } catch (error) {
        console.error('Error al guardar el curso:', error);
        // En caso de error
        res.redirect('/principal?success=false&message=Error al guardar el curso');
    }
});
// Ruta para la página principal
router.get('/', (req, res) => {
    res.render('index');
});
export default router;
