import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Task } from './Task';
import { Comment } from './Comment';

@Entity('users')
@Index(['usuario'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  usuario: string;

  @Column({ length: 120 })
  nombre: string;

  @Column()
  pass: string;

  @Column({ length: 20 })
  rol: 'Ingeniero' | 'Gerente' | 'Planta';

  @Column({ length: 6 })
  code: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Task, (task) => task.asignado_a)
  tasks: Task[];

  @OneToMany(() => Comment, (comment) => comment.usuario)
  comments: Comment[];
}
