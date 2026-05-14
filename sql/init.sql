-- Base de datos y tablas para el sistema de control de actividades

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(50) NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  pass TEXT NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('Ingeniero', 'Gerente')),
  code CHAR(6) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_usuario_lower ON users (LOWER(usuario));

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  tarea TEXT NOT NULL,
  description TEXT,
  asig TEXT,
  estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Asignada', 'En proceso', 'En espera', 'Pendiente revisión', 'Validación', 'Terminado', 'Cancelada')),
  fa DATE,
  fc DATE,
  esp TEXT,
  obs TEXT,
  link TEXT,
  asignado_a INTEGER REFERENCES users(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  fecha_asignacion TIMESTAMP WITHOUT TIME ZONE,
  fecha_cierre TIMESTAMP WITHOUT TIME ZONE,
  fecha_actualizacion TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comentarios (
  id SERIAL PRIMARY KEY,
  tarea_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  evidencia_link TEXT,
  fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Datos iniciales de usuarios
INSERT INTO users (usuario, nombre, pass, rol, code)
VALUES
  ('admin', 'Augusto Melo', 'admin123', 'Gerente', '000000'),
  ('ana', 'Ana Rodríguez', 'ana123', 'Ingeniero', '100001'),
  ('carlos', 'Carlos Martínez', 'carlos123', 'Ingeniero', '100002'),
  ('laura', 'Laura Pérez', 'laura123', 'Ingeniero', '100003'),
  ('andrés', 'Andrés Ramírez', 'andres123', 'Ingeniero', '100004');

-- Tareas de ejemplo
INSERT INTO tasks (tarea, description, asig, estado, fa, fc, esp, obs, link, asignado_a, fecha_asignacion)
VALUES
  ('Diseño de base de datos', 'Modelado ER para módulo de usuarios', 'Carlos Martínez', 'En proceso', '2026-05-05', NULL, '', 'Revisar normalización', '', (SELECT id FROM users WHERE usuario='carlos'), NOW()),
  ('API de autenticación', 'Endpoints JWT y refresh tokens', 'Laura Pérez', 'Pendiente revisión', '2026-05-07', NULL, '', 'Pendiente code review', '', (SELECT id FROM users WHERE usuario='laura'), NOW()),
  ('Migración de datos', 'Script de migración a producción', 'Andrés Ramírez', 'En espera', '2026-05-03', NULL, 'Esperando credenciales del cliente', '', '', (SELECT id FROM users WHERE usuario='andrés'), NOW()),
  ('Dashboard de reportes', 'Gráficas de actividad mensual', 'María Torres', 'Terminado', '2026-05-01', '2026-05-08', '', 'Aprobado por gerencia', '', NULL, NULL),
  ('Pruebas de integración', 'Suite de tests para módulo de pagos', 'Carlos Martínez', 'Pendiente', '2026-05-10', NULL, '', '', '', (SELECT id FROM users WHERE usuario='carlos'), NOW());
