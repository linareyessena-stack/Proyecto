"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./database");
const User_1 = require("./entities/User");
const Task_1 = require("./entities/Task");
const Comment_1 = require("./entities/Comment");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3551;
const API_PREFIX = '/api';
app.use(express_1.default.static(path_1.default.join(__dirname)));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const parseDate = (val) => {
    if (!val)
        return null;
    const ddmm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(val);
    if (ddmm)
        return new Date(`${ddmm[3]}-${ddmm[2]}-${ddmm[1]}`);
    return null;
};
const authenticate = async (req, res, next) => {
    const usuario = req.body?.usuario || req.headers['x-usuario'] || req.query?.usuario;
    if (!usuario)
        return res.status(401).json({ error: 'Usuario requerido' });
    try {
        const user = await database_1.AppDataSource.getRepository(User_1.User).findOne({
            where: { usuario: String(usuario).toLowerCase() },
        });
        if (!user)
            return res.status(401).json({ error: 'Usuario no encontrado' });
        req.user = user;
        next();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error de autenticación' });
    }
};
const requireRole = (role) => (req, res, next) => {
    if (req.user?.rol !== role)
        return res.status(403).json({ error: 'Permisos insuficientes' });
    next();
};
app.get(`${API_PREFIX}/health`, (req, res) => res.json({ status: 'ok' }));
app.post(`${API_PREFIX}/login`, async (req, res) => {
    const { usuario, pass } = req.body;
    if (!usuario || !pass)
        return res.status(400).json({ error: 'usuario y contraseña requeridos' });
    try {
        const user = await database_1.AppDataSource.getRepository(User_1.User).findOne({
            where: { usuario: String(usuario).toLowerCase(), pass },
        });
        if (!user)
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        return res.json({ user: { id: user.id, usuario: user.usuario, nombre: user.nombre, rol: user.rol, code: user.code } });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
app.post(`${API_PREFIX}/password/change`, async (req, res) => {
    const { usuario, currentPassword, newPassword } = req.body;
    if (!usuario || !currentPassword || !newPassword)
        return res.status(400).json({ error: 'usuario, contraseña actual y nueva contraseña requeridos' });
    try {
        const user = await database_1.AppDataSource.getRepository(User_1.User).findOne({
            where: { usuario: String(usuario).toLowerCase(), pass: currentPassword },
        });
        if (!user)
            return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
        user.pass = newPassword;
        user.updated_at = new Date();
        await database_1.AppDataSource.getRepository(User_1.User).save(user);
        return res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
app.post(`${API_PREFIX}/password/forgot`, async (req, res) => {
    const { usuario, code, newPassword } = req.body;
    if (!usuario || !code || !newPassword)
        return res.status(400).json({ error: 'usuario, código y nueva contraseña requeridos' });
    try {
        const user = await database_1.AppDataSource.getRepository(User_1.User).findOne({
            where: { usuario: String(usuario).toLowerCase(), code },
        });
        if (!user)
            return res.status(401).json({ error: 'Usuario o código incorrecto' });
        user.pass = newPassword;
        user.updated_at = new Date();
        await database_1.AppDataSource.getRepository(User_1.User).save(user);
        return res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
app.get(`${API_PREFIX}/users`, authenticate, requireRole('Gerente'), async (req, res) => {
    try {
        const users = await database_1.AppDataSource.getRepository(User_1.User).find({
            select: ['id', 'usuario', 'nombre', 'rol', 'code'],
            order: { nombre: 'ASC' },
        });
        res.json(users);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
app.post(`${API_PREFIX}/users`, authenticate, requireRole('Gerente'), async (req, res) => {
    let { usuario, nombre, pass, rol, code } = req.body;
    usuario = usuario ? String(usuario).trim().toLowerCase() : '';
    nombre = String(nombre || '').trim();
    pass = pass ? String(pass).trim() : '';
    if (!usuario || !nombre || !pass || !rol || !code)
        return res.status(400).json({ error: 'usuario, nombre, contraseña, rol y código requeridos' });
    try {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const existingUser = await userRepo.findOne({ where: { usuario } });
        if (existingUser)
            return res.status(409).json({ error: 'El usuario ya existe' });
        const newUser = userRepo.create({ usuario, nombre, pass, rol, code });
        const result = await userRepo.save(newUser);
        res.status(201).json({
            id: result.id,
            usuario: result.usuario,
            nombre: result.nombre,
            rol: result.rol,
            code: result.code,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
app.delete(`${API_PREFIX}/users/:id`, authenticate, requireRole('Gerente'), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
        const result = await database_1.AppDataSource.getRepository(User_1.User).delete(id);
        if (result.affected === 0)
            return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
app.put(`${API_PREFIX}/users/:id`, authenticate, requireRole('Gerente'), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    let { nombre, pass, rol, code } = req.body;
    pass = pass && String(pass).trim() ? String(pass).trim() : null;
    nombre = String(nombre || '').trim();
    if (!nombre || !rol || !code)
        return res.status(400).json({ error: 'nombre, rol y código requeridos' });
    try {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id } });
        if (!user)
            return res.status(404).json({ error: 'Usuario no encontrado' });
        user.nombre = nombre;
        user.rol = rol;
        user.code = code;
        if (pass)
            user.pass = pass;
        user.updated_at = new Date();
        const result = await userRepo.save(user);
        res.json({
            id: result.id,
            usuario: result.usuario,
            nombre: result.nombre,
            rol: result.rol,
            code: result.code,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
app.get(`${API_PREFIX}/tasks`, authenticate, async (req, res) => {
    try {
        const taskRepo = database_1.AppDataSource.getRepository(Task_1.Task);
        let query = taskRepo.createQueryBuilder('t')
            .leftJoinAndSelect('t.asignado_a', 'u')
            .select([
            't.id',
            't.tarea',
            't.description',
            't.estado',
            't.orden',
            't.fa',
            't.fc',
            't.esp',
            't.obs',
            't.link',
            't.fecha_creacion',
            't.fecha_asignacion',
            't.fecha_cierre',
            't.fecha_actualizacion',
            'u.nombre',
        ]);
        if (req.user.rol === 'Ingeniero') {
            query = query.where('t.asignado_a = :userId', { userId: req.user.id });
        }
        const tasks = await query.orderBy('t.estado', 'ASC').addOrderBy('t.orden', 'ASC').addOrderBy('t.id', 'ASC').getMany();
        const result = tasks.map((t) => ({
            id: t.id,
            tarea: t.tarea,
            desc: t.description,
            asig: t.asignado_a?.nombre || null,
            estado: t.estado,
            orden: t.orden,
            fa: t.fa ? formatDate(t.fa) : null,
            fc: t.fc ? formatDate(t.fc) : null,
            esp: t.esp,
            obs: t.obs,
            link: t.link,
            fecha_creacion: t.fecha_creacion,
            fecha_asignacion: t.fecha_asignacion,
            fecha_cierre: t.fecha_cierre,
            fecha_actualizacion: t.fecha_actualizacion,
            asignado_a: t.asignado_a?.id || null,
        }));
        res.json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
const formatDate = (date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};
app.post(`${API_PREFIX}/tasks`, authenticate, requireRole('Gerente'), async (req, res) => {
    const { tarea, desc, asignado_a, estado, fa, fc, esp, obs, link, orden } = req.body;
    if (!tarea || !estado)
        return res.status(400).json({ error: 'tarea y estado requieren valores válidos' });
    const asignadoId = asignado_a ? parseInt(asignado_a, 10) : null;
    const ordenValue = orden !== undefined && orden !== null ? Number(orden) : null;
    const faValue = parseDate(fa);
    const fcValue = parseDate(fc);
    try {
        const taskRepo = database_1.AppDataSource.getRepository(Task_1.Task);
        let finalOrden = ordenValue;
        if (!finalOrden) {
            const maxOrden = await taskRepo
                .createQueryBuilder('t')
                .where('t.estado = :estado', { estado })
                .select('MAX(t.orden)', 'max')
                .getRawOne();
            finalOrden = (maxOrden?.max || 0) + 1;
        }
        const task = taskRepo.create({
            tarea,
            description: desc,
            estado,
            fa: faValue,
            fc: fcValue,
            esp,
            obs,
            link,
            orden: finalOrden,
            fecha_asignacion: asignadoId ? new Date() : null,
        });
        if (asignadoId) {
            const user = await database_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: asignadoId } });
            if (user)
                task.asignado_a = user;
        }
        const result = await taskRepo.save(task);
        const savedTask = await taskRepo.findOne({
            where: { id: result.id },
            relations: ['asignado_a'],
        });
        res.status(201).json({
            id: savedTask.id,
            tarea: savedTask.tarea,
            desc: savedTask.description,
            asig: savedTask.asignado_a?.nombre || null,
            estado: savedTask.estado,
            fa: savedTask.fa ? formatDate(savedTask.fa) : null,
            fc: savedTask.fc ? formatDate(savedTask.fc) : null,
            esp: savedTask.esp,
            obs: savedTask.obs,
            link: savedTask.link,
            fecha_creacion: savedTask.fecha_creacion,
            fecha_asignacion: savedTask.fecha_asignacion,
            fecha_cierre: savedTask.fecha_cierre,
            fecha_actualizacion: savedTask.fecha_actualizacion,
            asignado_a: savedTask.asignado_a?.id || null,
            orden: savedTask.orden,
        });
    }
    catch (error) {
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
        const task = await database_1.AppDataSource.getRepository(Task_1.Task).findOne({ where: { id } });
        if (!task || task.asignado_a?.id !== req.user.id)
            return res.status(403).json({ error: 'No tienes permisos para editar esta tarea' });
    }
    const asignadoId = asignado_a ? parseInt(asignado_a, 10) : null;
    const ordenValue = orden !== undefined && orden !== null ? Number(orden) : null;
    const faValue = parseDate(fa);
    const fcValue = parseDate(fc);
    try {
        const taskRepo = database_1.AppDataSource.getRepository(Task_1.Task);
        const task = await taskRepo.findOne({ where: { id }, relations: ['asignado_a'] });
        if (!task)
            return res.status(404).json({ error: 'Tarea no encontrada' });
        const wasUnassigned = !task.asignado_a;
        const changedAssignee = asignadoId && task.asignado_a?.id !== asignadoId;
        task.tarea = tarea;
        task.description = desc;
        task.estado = estado;
        task.fa = faValue;
        task.fc = fcValue;
        task.esp = esp;
        task.obs = obs;
        task.link = link;
        task.fecha_actualizacion = new Date();
        if (ordenValue !== null)
            task.orden = ordenValue;
        if (estado === 'Terminado' && !task.fecha_cierre)
            task.fecha_cierre = new Date();
        if ((wasUnassigned || changedAssignee) && asignadoId)
            task.fecha_asignacion = new Date();
        if (asignadoId) {
            const user = await database_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: asignadoId } });
            if (user)
                task.asignado_a = user;
        }
        else {
            task.asignado_a = null;
        }
        const result = await taskRepo.save(task);
        const updatedTask = await taskRepo.findOne({ where: { id: result.id }, relations: ['asignado_a'] });
        res.json({
            id: updatedTask.id,
            tarea: updatedTask.tarea,
            desc: updatedTask.description,
            asig: updatedTask.asignado_a?.nombre || null,
            estado: updatedTask.estado,
            fa: updatedTask.fa ? formatDate(updatedTask.fa) : null,
            fc: updatedTask.fc ? formatDate(updatedTask.fc) : null,
            esp: updatedTask.esp,
            obs: updatedTask.obs,
            link: updatedTask.link,
            orden: updatedTask.orden,
            fecha_creacion: updatedTask.fecha_creacion,
            fecha_asignacion: updatedTask.fecha_asignacion,
            fecha_cierre: updatedTask.fecha_cierre,
            fecha_actualizacion: updatedTask.fecha_actualizacion,
            asignado_a: updatedTask.asignado_a?.id || null,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
app.delete(`${API_PREFIX}/tasks/:id`, authenticate, requireRole('Gerente'), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
        const result = await database_1.AppDataSource.getRepository(Task_1.Task).delete(id);
        if (result.affected === 0)
            return res.status(404).json({ error: 'Tarea no encontrada' });
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
app.get(`${API_PREFIX}/tasks/:id/comments`, authenticate, async (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    if (req.user.rol !== 'Gerente') {
        const task = await database_1.AppDataSource.getRepository(Task_1.Task).findOne({ where: { id: taskId } });
        if (!task || task.asignado_a?.id !== req.user.id)
            return res.status(403).json({ error: 'No tienes permisos para ver comentarios de esta tarea' });
    }
    try {
        const comments = await database_1.AppDataSource.getRepository(Comment_1.Comment).find({
            where: { tarea: { id: taskId } },
            relations: ['usuario'],
            order: { fecha_creacion: 'ASC' },
        });
        const result = comments.map((c) => ({
            id: c.id,
            comentario: c.comentario,
            evidencia_link: c.evidencia_link,
            fecha_creacion: c.fecha_creacion,
            usuario: c.usuario.nombre,
            rol: c.usuario.rol,
        }));
        res.json(result);
    }
    catch (error) {
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
    if (req.user.rol !== 'Gerente') {
        const task = await database_1.AppDataSource.getRepository(Task_1.Task).findOne({ where: { id: taskId } });
        if (!task || task.asignado_a?.id !== req.user.id)
            return res.status(403).json({ error: 'No tienes permisos para comentar en esta tarea' });
    }
    try {
        const commentRepo = database_1.AppDataSource.getRepository(Comment_1.Comment);
        const task = await database_1.AppDataSource.getRepository(Task_1.Task).findOne({ where: { id: taskId } });
        if (!task)
            return res.status(404).json({ error: 'Tarea no encontrada' });
        const comment = commentRepo.create({
            comentario,
            evidencia_link,
            tarea: task,
            usuario: req.user,
        });
        const result = await commentRepo.save(comment);
        res.status(201).json({
            id: result.id,
            comentario: result.comentario,
            evidencia_link: result.evidencia_link,
            fecha_creacion: result.fecha_creacion,
            usuario: req.user.nombre,
            rol: req.user.rol,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
(async () => {
    try {
        await database_1.AppDataSource.initialize();
        console.log('✅ Conexión a base de datos establecida con TypeORM');
        const server = app.listen(PORT, () => {
            console.log(`🚀 API escuchando en http://localhost:${PORT}`);
        });
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Error: el puerto ${PORT} ya está en uso. Cierra el proceso que lo usa o cambia PORT en el archivo .env.`);
            }
            else {
                console.error('Error del servidor:', error);
            }
            process.exit(1);
        });
        const shutdown = async (signal) => {
            console.log(`\nRecibido ${signal}. Cerrando servidor...`);
            server.close(async () => {
                try {
                    await database_1.AppDataSource.destroy();
                    console.log('✅ Conexión a base de datos cerrada');
                    process.exit(0);
                }
                catch (err) {
                    console.error('Error cerrando conexión:', err);
                    process.exit(1);
                }
            });
            setTimeout(() => {
                console.error('No se pudo cerrar gracefully, forzando salida...');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }
    catch (error) {
        console.error('❌ Error inicializando base de datos:', error);
        process.exit(1);
    }
})();
