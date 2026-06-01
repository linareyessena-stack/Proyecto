import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Task } from './entities/Task';
import { Comment } from './entities/Comment';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Alcaldia2026',
  database: process.env.DB_NAME || 'control_actividades',
  synchronize: false,
  logging: ['error', 'warn', 'query', 'info'],
  entities: [User, Task, Comment],
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
});
