const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3551;
const API_PREFIX = '/api';

app.use(express.static(path.join(__dirname)));
app.use(cors());
app.use(express.json());


const parseDate= (val) => { 
  if (!val) return null;
  const ddmm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(val);
  if (ddmm) return `${ddmm[3]}-${ddmm[2]}-${ddmm[1]}`;
  return val;
};

const authenticate = async (req,res,next) => {
const usuario = req.body?.usuario || req.headers['x-usuario'] || req.query?.usuario;
  if (!usuario) return res.status(401).json({ error: 'Usuario requerido' });

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(usuario) = LOWER($1)', [usuario]);
    if (result.rowCount === 0) return res.status(401).json({error:'Usuario no encontrado'});
    req.user=result.rows[0];
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error de autenticación' });
  }
};


const requireRole = (role) => (req, res, next) => {
  if (req.user.rol !== role) return res.status(403).json({ error: 'Permisos insuficientes' });
  next();
};

app.get(`${API_PREFIX}/health`, (req, res) => res.json({ status: 'ok' }));

app.post(`${API_PREFIX}/login`, async (req, res) => {
  const { usuario, pass } = req.body;
  if (!usuario || !pass) return res.status(400).json({ error: 'usuario y contraseña requeridos' });
  try {
    const result = await pool.query(
      `SELECT id, usuario, nombre, rol, code FROM users WHERE LOWER(usuario) = LOWER($1) AND pass = $2`,
      [usuario, pass]
    );

    if (result.rowCount === 0) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post(`${API_PREFIX}/password/change`, async (req, res) => {
  const { usuario, currentPassword, newPassword } = req.body;
  if (!usuario || !currentPassword || !newPassword)
    return res.status(400).json({ error: 'usuario, contraseña actual y nueva contraseña requeridos' });

  try {
    const verify = await pool.query(
      `SELECT id FROM users WHERE LOWER(usuario) = LOWER($1) AND pass = $2`,
      [usuario, currentPassword]
    );

    if (verify.rowCount === 0) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    await pool.query(`UPDATE users SET pass = $1, updated_at = NOW() WHERE id = $2`,[newPassword, verify.rows[0].id]);
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post(`${API_PREFIX}/password/forgot`, async (req, res) => {
  const { usuario, code, newPassword } = req.body;
  if (!usuario || !code || !newPassword) 
    return res.status(400).json({ error: 'usuario, código y nueva contraseña requeridos' });
  try {
    const result = await pool.query(
      `SELECT id FROM users WHERE LOWER(usuario) = LOWER($1) AND code = $2`,
      [usuario, code]
    );

    if (result.rowCount === 0) return res.status(401).json({ error: 'Usuario o código incorrecto' });
       await pool.query(`UPDATE users SET pass = $1, updated_at = NOW() WHERE id = $2`,[newPassword, result.rows[0].id]);
       return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get(`${API_PREFIX}/users`, async (req, res) => {
    try{
    const result = await pool.query(`SELECT id,usuario,nombre,rol,code FROM users ORDER BY nombre`);
    res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({error:'Error interno del servidor'});
  }
  });
  app.put(`${API_PREFIX}/users/:id`, authenticate, requireRole('Gerente'), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { usuario, nombre, pass, rol, code } = req.body;
    if (!nombre || !rol || !code)
      return res.status(400).json({ error: 'nombre, rol y código requeridos' });
    try {
      const result = await pool.query(
        `UPDATE users
         SET usuario = COALESCE(NULLIF($1, ''), usuario),
             pass = COALESCE(NULLIF($2, ''), pass),
             nombre = $3,
             rol = $4,
             code = $5,
             updated_at = NOW()
         WHERE id = $6
         RETURNING id, usuario, nombre, rol, code`,
        [usuario, pass, nombre, rol, code, id]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

app.get(`${API_PREFIX}/tasks`, authenticate, async (req, res) => {
  try {
    let query = `
      SELECT t.id, t.tarea, t.description AS "desc", u.nombre AS asig, t.estado, t.orden,
             to_char(t.fa, 'DD/MM/YYYY') AS fa,
             to_char(t.fc, 'DD/MM/YYYY') AS fc,
             t.esp, t.obs, t.link, t.fecha_creacion, t.fecha_asignacion, t.fecha_cierre, t.fecha_actualizacion, t.asignado_a
       FROM tasks t
       LEFT JOIN users u ON t.asignado_a = u.id
    `;
    const params = [];
    if (req.user.rol === 'Ingeniero') {
    query += ' WHERE t.asignado_a = $1';
    params.push(req.user.id);
    }
    query += ' ORDER BY t.estado, t.orden, t.id';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
}
});

app.post(`${API_PREFIX}/tasks`, authenticate, requireRole('Gerente'), async (req, res) => {
  const { tarea, desc, asignado_a, estado, fa, fc, esp, obs, link, orden } = req.body;
  if (!tarea || !estado)
    return res.status(400).json({ error: 'tarea y estado requieren valores válidos' });

const asignadoId = asignado_a ? parseInt(asignado_a, 10) : null;
const ordenValue = orden !== undefined && orden !== null ? Number(orden) : null;
const faValue=parseDate(fa);
const fcValue=parseDate(fc);

  try {
    const result = await pool.query(
      `INSERT INTO tasks (tarea, description, asignado_a, estado, fa, fc, esp, obs, link, orden, fecha_creacion, fecha_actualizacion)
       VALUES ($1, $2, $3, $4::varchar, NULLIF($5, '')::date, NULLIF($6, '')::date, $7, $8, $9,
        COALESCE($10, (SELECT COALESCE(MAX(orden), 0) + 1 FROM tasks WHERE estado = $4::varchar)), NOW(), NOW())
       RETURNING id, tarea, description AS "desc", (SELECT nombre FROM users WHERE id = asignado_a) AS asig, estado,
                 to_char(fa, 'DD/MM/YYYY') AS fa,
                 to_char(fc, 'DD/MM/YYYY') AS fc,
                 esp, obs, link, fecha_creacion, fecha_asignacion, fecha_cierre, fecha_actualizacion, asignado_a, orden`,
      [tarea, desc, asignadoId, estado, faValue, fcValue, esp, obs, link, ordenValue]
    );

    if (asignadoId) {
      await pool.query('UPDATE tasks SET fecha_asignacion = NOW() WHERE id = $1', [result.rows[0].id]);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put(`${API_PREFIX}/tasks/:id`, authenticate, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { tarea, desc, asignado_a, estado, fa, fc, esp, obs, link, orden } = req.body;
  if (!tarea || !estado)
    return res.status(400).json({ error: 'tarea y estado requieren valores válidos' });

  if (req.user.rol !== 'Gerente') {
    const taskCheck = await pool.query('SELECT asignado_a FROM tasks WHERE id = $1', [id]);
    if (taskCheck.rowCount === 0 || taskCheck.rows[0].asignado_a !== req.user.id)
      return res.status(403).json({ error: 'No tienes permisos para editar esta tarea' });
  }

  const asignadoId = asignado_a ? parseInt(asignado_a, 10) : null;
  const ordenValue = orden !== undefined && orden !== null ? Number(orden) : null;
  const faValue = parseDate(fa);
  const fcValue = parseDate(fc);

  try {
    const result = await pool.query(
      `UPDATE tasks
       SET tarea = $1,
           description = $2,
           asignado_a = $3::int,
           estado = $4::varchar,
           fa = NULLIF($5, '')::date,
           fc = NULLIF($6, '')::date,
           esp = $7,
           obs = $8,
           link = $9,
           orden = COALESCE($10::numeric, orden),
           fecha_actualizacion = NOW(),
           fecha_cierre = CASE WHEN $4::varchar = 'Terminado' THEN COALESCE(fecha_cierre, NOW()) ELSE fecha_cierre END,
           fecha_asignacion = CASE WHEN $3::int IS NOT NULL AND (fecha_asignacion IS NULL OR $3::int != asignado_a) THEN NOW() ELSE fecha_asignacion END
       WHERE id = $11
       RETURNING id, tarea, description AS "desc", (SELECT nombre FROM users WHERE id = asignado_a) AS asig, estado,
                 to_char(fa, 'DD/MM/YYYY') AS fa,
                 to_char(fc, 'DD/MM/YYYY') AS fc,
                 esp, obs, link, orden, fecha_creacion, fecha_asignacion, fecha_cierre, fecha_actualizacion,asignado_a`,
      [tarea, desc, asignadoId, estado, faValue, fcValue, esp, obs, link, ordenValue, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete(`${API_PREFIX}/tasks/:id`, authenticate, requireRole('Gerente'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    if (result.rowCount === 0) 
      return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json({success:true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


app.get(`${API_PREFIX}/tasks/:id/comments`, authenticate, async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  // Verificar permisos: solo Gerente o asignado
  if (req.user.rol !== 'Gerente') {
    const taskCheck = await pool.query('SELECT asignado_a FROM tasks WHERE id = $1', [taskId]);
    if (taskCheck.rowCount === 0 || taskCheck.rows[0].asignado_a !== req.user.id) 
      return res.status(403).json({ error: 'No tienes permisos para ver comentarios de esta tarea' });
    }

  try {
    const result = await pool.query(
      `SELECT c.id, c.comentario, c.evidencia_link, c.fecha_creacion, u.nombre AS usuario, u.rol
       FROM comentarios c
       JOIN users u ON c.usuario_id = u.id
       WHERE c.tarea_id = $1
       ORDER BY c.fecha_creacion`,
      [taskId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post(`${API_PREFIX}/tasks/:id/comments`, authenticate, async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const { comentario, evidencia_link } = req.body;
  if (!comentario) {
    return res.status(400).json({ error: 'Comentario requerido' });
  }

  // Verificar permisos: solo Gerente o asignado
  if (req.user.rol !== 'Gerente') {
    const taskCheck = await pool.query('SELECT asignado_a FROM tasks WHERE id = $1', [taskId]);
    if (taskCheck.rowCount === 0 || taskCheck.rows[0].asignado_a !== req.user.id) 
      return res.status(403).json({ error: 'No tienes permisos para comentar en esta tarea' });
    }

  try {
    const result = await pool.query(
      `INSERT INTO comentarios (tarea_id, usuario_id, comentario, evidencia_link, fecha_creacion)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, comentario, evidencia_link, fecha_creacion, (SELECT nombre FROM users WHERE id = $2) AS usuario, (SELECT rol FROM users WHERE id = $2) AS rol`,
      [taskId, req.user.id, comentario, evidencia_link]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const ensureSchema = async () => {
  try {
    await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS orden NUMERIC DEFAULT 0');
    console.log('Esquema verificado: columna orden OK');
  } catch (e) {
    console.error('Error verificando esquema:', e);
  }
};

(async () => {
  await ensureSchema();
  const server = app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Error: el puerto ${PORT} ya está en uso. Cierra el proceso que lo usa o cambia PORT en el archivo .env.`);
    } else {
      console.error('Error del servidor:', error);
    }
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\nRecibido ${signal}. Cerrando servidor...`);
    server.close(async () => {
      try {
        await pool.end();
        console.log('Pool de base de datos cerrado');
        process.exit(0);
      } catch (err) {
        console.error('Error cerrando pool:', err);
        process.exit(1);
      }
    });

    // Force exit after 10 segundos
    setTimeout(() => {
      console.error('No se pudo cerrar gracefully, forzando salida...');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})();
