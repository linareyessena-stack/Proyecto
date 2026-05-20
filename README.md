# Control de Actividades - Backend PostgreSQL

## Configuración

1. Instala dependencias:

```bash
npm install
```

2. Configura el archivo `.env` con tus credenciales PostgreSQL:

```env
PORT=3551
DATABASE_URL=postgresql://postgres:password@localhost:5432/control_actividades
PGSSL=false
```

3. Crea la base de datos y ejecuta el script SQL:

```bash
createdb control_actividades
psql -d control_actividades -f sql/init.sql
```

## Arrancar el servidor

```bash
npm start
```

El backend quedará disponible en `http://localhost:3551`.

## Endpoints principales

- `POST /api/login`
- `POST /api/password/change`
- `POST /api/password/forgot`
- `GET /api/users`
- `PUT /api/users/:id`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

## Notas

- El front-end actual ya está configurado para conectarse al backend en `http://localhost:3551/api`.
- Si abres `index.html` con `file://`, el backend debe estar ejecutándose y tendrá que permitir CORS.
