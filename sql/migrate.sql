-- Migración para agregar nuevas columnas y tabla

-- Actualizar estados existentes
UPDATE tasks SET estado = 'Pendiente' WHERE estado = 'Tarea';
UPDATE tasks SET estado = 'En proceso' WHERE estado = 'En proceso';
UPDATE tasks SET estado = 'Terminado' WHERE estado = 'Terminado';
UPDATE tasks SET estado = 'Pendiente revisión' WHERE estado = 'Pendiente revisión';
UPDATE tasks SET estado = 'En espera' WHERE estado = 'En espera';

-- Agregar columnas a tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS asignado_a INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS fecha_asignacion TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS orden NUMERIC DEFAULT 0;

-- Crear tabla comentarios
CREATE TABLE IF NOT EXISTS comentarios (
  id SERIAL PRIMARY KEY,
  tarea_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  evidencia_link TEXT,
  fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Actualizar tareas existentes con asignado_a basado en asig
UPDATE tasks SET asignado_a = (SELECT id FROM users WHERE nombre = tasks.asig LIMIT 1) WHERE asignado_a IS NULL AND asig IS NOT NULL;

-- Actualizar fechas para tareas existentes
UPDATE tasks SET fecha_creacion = created_at WHERE fecha_creacion IS NULL;
UPDATE tasks SET fecha_actualizacion = updated_at WHERE fecha_actualizacion IS NULL;