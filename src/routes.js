import express from 'express';
import { pool } from './db.js';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs/promises'; // Usamos fs.promises para manejar archivos de forma asincrónica
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';
import { createReadStream } from 'fs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
router.get('/principal', async (req, res) => {
    try {
        // Obtener la lista de cursos desde la base de datos
        const [result] = await pool.query('SELECT * FROM cursos');
        const cursos = result && result.length > 0 ? result : [];

        // Log de la consulta SQL
        // console.log('Consulta SQL:', 'SELECT * FROM cursos');

        // Log del contenido de Cursos
        // console.log('Contenido de Cursos:', cursos);

        // Renderizar la plantilla con la lista de cursos
        res.render('principal', { cursos });
    } catch (error) {
        console.error('Error al obtener cursos:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// Ruta para la página principal (utilizando principal.ejs)
router.get('/principal/:id', async (req, res) => {
    const cursoId = req.params.id;

    try {
        // Obtener un curso específico desde la base de datos
        const [result] = await pool.query('SELECT * FROM cursos WHERE id = ?', [cursoId]);

        if (result && result.length > 0) {
            const curso = result[0];
            // Renderizar la plantilla con el curso específico
            res.render('principal', { curso });
        } else {
            res.status(404).json({ error: 'Curso no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener curso:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
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
        // console.log(req.body);
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

const upload = multer({ dest: 'uploads/' }); // Directorio donde se almacenarán temporalmente los archivos

router.post('/guardarCurso', upload.single('archivoCurso'), async (req, res) => {
    try {
        // Verificar si se proporcionó un archivo
        if (!req.file) {
            return res.redirect('/principal?success=false&message=No se proporcionó un archivo');
        }

        const {
            nombreCurso,
            tipoCurso,
            duracionCurso,
            fechaInicio,
            instructor,
            tipoInstitucion,
        } = req.body;

        const timestamp = Date.now(); // Sello de tiempo en milisegundos
        const pdfFileName = `Curso_${timestamp}.pdf`; // Nombre de archivo único

        const pdfFilePath = path.join(__dirname, 'docs', pdfFileName);

        // Mover el archivo a la carpeta "docs"
        await fs.rename(req.file.path, pdfFilePath);

        // Insertar el nuevo curso en la base de datos con la ruta del archivo PDF
        await pool.query(
            'INSERT INTO cursos (nombreCurso, TipoCurso, DuracionCurso, FechaInicio, Instructor, Lugar, DocumentPath) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombreCurso, tipoCurso, duracionCurso, fechaInicio, instructor, tipoInstitucion, pdfFilePath]
        );

        // Después de guardar el curso exitosamente
        res.redirect('/principal?success=true&message=¡Curso guardado exitosamente!');
    } catch (error) {
        console.error('Error al guardar el curso:', error);
        // En caso de error
        res.redirect('/principal?success=false&message=Error al guardar el curso');
    }
});




router.get('/download/:id', async (req, res) => {
    const cursoId = req.params.id;

    try {
        // Consulta para obtener el curso por ID
        const [result] = await pool.query('SELECT * FROM cursos WHERE id = ?', [cursoId]);

        if (result && result.length > 0) {
            const curso = result[0];
            const pdfFilePath = curso.DocumentPath;

            // Configurar el encabezado para la descarga del archivo
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=curso-${curso.nombreCurso}.pdf`);

            // Crear un flujo de lectura desde el archivo y enviarlo como respuesta
            const readStream = createReadStream(pdfFilePath);
            readStream.pipe(res);

        } else {
            res.status(404).send('Curso no encontrado');
        }
    } catch (error) {
        console.error('Error al descargar el curso:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// Ruta para obtener datos del curso por ID
router.get('/editar/:id', async (req, res) => {
    const cursoId = req.params.id;

    try {
        // Consulta para obtener el curso por ID
        const [result] = await pool.query('SELECT * FROM cursos WHERE id = ?', [cursoId]);

        if (result && result.length > 0) {
            const curso = result[0];
            res.json(curso);
        } else {
            res.status(404).json({ error: 'Curso no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener datos del curso:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para eliminar un curso por ID
router.post('/eliminarCurso/:id', async (req, res) => {
    const cursoId = req.params.id;

    try {
        // Consulta para obtener la ruta del archivo PDF antes de eliminar el curso
        const [result] = await pool.query('SELECT DocumentPath FROM cursos WHERE id = ?', [cursoId]);

        if (result && result.length > 0) {
            const pdfFilePath = result[0].DocumentPath;

            // Eliminar el curso de la base de datos
            await pool.query('DELETE FROM cursos WHERE id = ?', [cursoId]);

            // Eliminar el archivo PDF asociado
            await fs.unlink(pdfFilePath);

            // Enviar una respuesta indicando éxito
            res.json({ success: true, message: 'Curso eliminado exitosamente' });
        } else {
            res.status(404).json({ success: false, message: 'Curso no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar el curso:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});


// Ruta para la página principal
router.get('/', (req, res) => {
    res.render('index');
});
export default router;
