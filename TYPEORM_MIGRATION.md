# Sistema de Control de Actividades - TypeORM Edition 🚀

## Cambios Realizados

✅ **Migración a TypeORM**: El proyecto ahora usa TypeORM en lugar de consultas SQL directas.
✅ **Eliminación de Migraciones SQL**: Las migraciones SQL fueron reemplazadas por entidades TypeORM que se sincronizan automáticamente.
✅ **TypeScript**: Proyecto completamente reescrito en TypeScript para mayor seguridad de tipos.

## Estructura del Proyecto

```
/src
  /entities          # Entidades TypeORM
    - User.ts        # Entidad de usuarios
    - Task.ts        # Entidad de tareas
    - Comment.ts     # Entidad de comentarios
  - database.ts      # Configuración de TypeORM
  - server.ts        # Servidor Express
  - seed.ts          # Script para inicializar datos
```

## Instalación y Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Asegúrate de tener un archivo `.env` con:
```
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/tu_base_datos
PORT=3551
NODE_ENV=development
```

### 3. Inicializar la base de datos
TypeORM sincronizará automáticamente las entidades con la base de datos al iniciar el servidor por primera vez.

Para agregar datos de prueba:
```bash
npm run seed
```

## Scripts Disponibles

- `npm start` - Inicia el servidor en producción
- `npm run dev` - Inicia el servidor en desarrollo con nodemon
- `npm run seed` - Inicializa la base de datos con datos de prueba

## Características

### Entidades
- **User**: Gestión de usuarios con roles (Ingeniero, Gerente, Planta)
- **Task**: Gestión de tareas con múltiples estados
- **Comment**: Comentarios y evidencias en tareas

### Endpoints API

#### Autenticación
- `POST /api/login` - Login de usuario
- `POST /api/password/change` - Cambiar contraseña
- `POST /api/password/forgot` - Recuperar contraseña

#### Usuarios (solo Gerente)
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

#### Tareas
- `GET /api/tasks` - Listar tareas
- `POST /api/tasks` - Crear tarea (solo Gerente)
- `PUT /api/tasks/:id` - Actualizar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea (solo Gerente)

#### Comentarios
- `GET /api/tasks/:id/comments` - Listar comentarios
- `POST /api/tasks/:id/comments` - Agregar comentario

## Ventajas de TypeORM

✨ **Type Safety**: Completo soporte de TypeScript con tipado de datos
🔄 **Sincronización Automática**: Las tablas se crean automáticamente desde las entidades
🎯 **QueryBuilder**: Constructor de queries más flexible y seguro que SQL directo
🔗 **Relaciones**: Manejo automático de relaciones entre entidades
🛡️ **Migraciones Automáticas**: Con `synchronize: true`, no necesitas archivos de migración

## Notas importantes

- El proyecto ahora usa **synchronize: true** en desarrollo, lo que sincroniza automáticamente las entidades con la BD
- Para producción, considera usar el sistema de migraciones de TypeORM
- Los archivos SQL antiguos en `/sql` ya no son necesarios

## Solución de Problemas

Si encuentras problemas de conexión:
1. Verifica que PostgreSQL está corriendo
2. Comprueba las credenciales en `.env`
3. Asegúrate de que la base de datos existe

Si hay problemas con TypeORM:
1. Limpia `node_modules` y vuelve a instalar: `npm install`
2. Reinicia el servidor
