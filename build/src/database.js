"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const User_1 = require("./entities/User");
const Task_1 = require("./entities/Task");
const Comment_1 = require("./entities/Comment");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: true, // Auto-crea tablas basado en entidades
    logging: process.env.NODE_ENV === 'development',
    entities: [User_1.User, Task_1.Task, Comment_1.Comment],
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
});
