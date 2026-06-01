"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("./database");
const User_1 = require("./entities/User");
const Task_1 = require("./entities/Task");
const seedDatabase = async () => {
    try {
        await database_1.AppDataSource.initialize();
        console.log('✅ Conexión a base de datos establecida');
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const taskRepo = database_1.AppDataSource.getRepository(Task_1.Task);
        // Verificar si ya existen usuarios
        const existingUsers = await userRepo.find();
        if (existingUsers.length > 0) {
            console.log('✅ Base de datos ya contiene datos. Abortando seed.');
            await database_1.AppDataSource.destroy();
            return;
        }
        // Crear usuarios
        const users = [
            { usuario: 'augusto', nombre: 'Augusto Melo', pass: 'admin123', rol: 'Gerente', code: '000000' },
            { usuario: 'juan pablo', nombre: 'Juan Pablo Prieto', pass: 'juanpablo123', rol: 'Ingeniero', code: '100001' },
            { usuario: 'eduardo', nombre: 'Eduardo Rodríguez', pass: 'eduardo123', rol: 'Ingeniero', code: '100002' },
            { usuario: 'julian montanez', nombre: 'Julian Montanez', pass: 'julian123', rol: 'Ingeniero', code: '100003' },
            { usuario: 'miguel avellaneda', nombre: 'Miguel Avellaneda', pass: 'miguel123', rol: 'Ingeniero', code: '100004' },
            { usuario: 'julio', nombre: 'Julio', pass: 'julio123', rol: 'Ingeniero', code: '100005' },
            { usuario: 'andres felipe', nombre: 'Andres Felipe', pass: 'andres123', rol: 'Ingeniero', code: '100006' },
            { usuario: 'jonathan', nombre: 'Jonathan', pass: 'jonathan123', rol: 'Ingeniero', code: '100007' },
            { usuario: 'lina reyes', nombre: 'Lina Reyes', pass: 'lina123', rol: 'Ingeniero', code: '100008' },
            { usuario: 'david morales', nombre: 'David Morales', pass: 'david123', rol: 'Ingeniero', code: '100009' },
            { usuario: 'estevan', nombre: 'estevan', pass: 'estevan123', rol: 'Ingeniero', code: '100010' },
            { usuario: 'angie', nombre: 'Angie Cipamocha', pass: 'angie123', rol: 'Ingeniero', code: '100011' },
            { usuario: 'vicente wilches', nombre: 'Vicente Wilches', pass: 'vicente123', rol: 'Ingeniero', code: '100012' },
            { usuario: 'hernan', nombre: 'Hernan', pass: 'hernan123', rol: 'Ingeniero', code: '100013' },
            { usuario: 'faber', nombre: 'Favert', pass: 'faber123', rol: 'Ingeniero', code: '100014' },
            { usuario: 'cesar', nombre: 'Cesar', pass: 'cesar123', rol: 'Ingeniero', code: '100015' },
            { usuario: 'camilo', nombre: 'Camilo', pass: 'camilo123', rol: 'Ingeniero', code: '100016' },
            { usuario: 'sebastian', nombre: 'Sebastian Lara', pass: 'sebastian123', rol: 'Ingeniero', code: '100017' },
            { usuario: 'fabio coconudo', nombre: 'Fabio coconudo', pass: 'fabio123', rol: 'Ingeniero', code: '100018' },
            { usuario: 'deisy', nombre: 'Deisy', pass: 'deisy123', rol: 'Ingeniero', code: '100019' },
            { usuario: 'maria lucia', nombre: 'Maria Lucia', pass: 'maria123', rol: 'Ingeniero', code: '100020' },
            { usuario: 'fernando', nombre: 'Fernando Barrios', pass: 'fernando123', rol: 'Ingeniero', code: '100021' },
            { usuario: 'andres', nombre: 'Andres', pass: 'andres123', rol: 'Ingeniero', code: '100022' },
        ];
        console.log(`📝 Creando ${users.length} usuarios...`);
        const savedUsers = await userRepo.save(users);
        console.log(`✅ ${savedUsers.length} usuarios creados`);
        // Crear tareas de ejemplo
        const tasks = [
            {
                tarea: 'Diseño de base de datos',
                description: 'Modelado ER para módulo de usuarios',
                estado: 'En proceso',
                fa: new Date('2026-05-05'),
                fc: null,
                esp: '',
                obs: 'Revisar normalización',
                link: '',
                asignado_a: savedUsers.find((u) => u.usuario === 'juan pablo') || null,
                orden: 1,
                fecha_asignacion: new Date(),
            },
            {
                tarea: 'API de autenticación',
                description: 'Endpoints JWT y refresh tokens',
                estado: 'Pendiente revisión',
                fa: new Date('2026-05-07'),
                fc: null,
                esp: '',
                obs: 'Pendiente code review',
                link: '',
                asignado_a: savedUsers.find((u) => u.usuario === 'lina reyes') || null,
                orden: 2,
                fecha_asignacion: new Date(),
            },
            {
                tarea: 'Migración de datos',
                description: 'Script de migración a producción',
                estado: 'En espera',
                fa: new Date('2026-05-03'),
                fc: null,
                esp: 'Esperando credenciales del cliente',
                obs: '',
                link: '',
                asignado_a: savedUsers.find((u) => u.usuario === 'julio') || null,
                orden: 3,
                fecha_asignacion: new Date(),
            },
            {
                tarea: 'Dashboard de reportes',
                description: 'Gráficas de actividad mensual',
                estado: 'Terminado',
                fa: new Date('2026-05-01'),
                fc: new Date('2026-05-08'),
                esp: '',
                obs: 'Aprobado por gerencia',
                link: '',
                asignado_a: null,
                orden: 4,
                fecha_asignacion: null,
                fecha_cierre: new Date('2026-05-08'),
            },
            {
                tarea: 'Pruebas de integración',
                description: 'Suite de tests para módulo de pagos',
                estado: 'Pendiente',
                fa: new Date('2026-05-10'),
                fc: null,
                esp: '',
                obs: '',
                link: '',
                asignado_a: savedUsers.find((u) => u.usuario === 'juan pablo') || null,
                orden: 5,
                fecha_asignacion: new Date(),
            },
        ];
        console.log(`📝 Creando ${tasks.length} tareas de ejemplo...`);
        await taskRepo.save(tasks);
        console.log(`✅ ${tasks.length} tareas creadas`);
        console.log('\n✅ Base de datos inicializada correctamente');
    }
    catch (error) {
        console.error('❌ Error inicializando base de datos:', error);
        process.exit(1);
    }
    finally {
        await database_1.AppDataSource.destroy();
    }
};
seedDatabase();
