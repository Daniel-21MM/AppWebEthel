import { createPool } from 'mysql2/promise';
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_USER, DB_PORT } from './config.js';

// Crea la pool
const pool = createPool({
  user: DB_USER,
  password: DB_PASSWORD,
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME
});

// Intenta obtener una conexión para verificar la conexión
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a la base de datos establecida correctamente');
    connection.release();
  } catch (error) {
    console.error('Error de conexión a la base de datos:', error);
  }
})();

export { pool };


