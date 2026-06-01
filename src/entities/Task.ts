import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { Comment } from './Comment';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tarea: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'Pendiente',
  })
  estado: 'Pendiente' | 'Asignada' | 'En proceso' | 'En espera' | 'Pendiente revisión' | 'Validación' | 'Terminado' | 'Cancelada';

  @Column({ type: 'date', nullable: true })
  fa: Date | null;

  @Column({ type: 'date', nullable: true })
  fc: Date | null;

  @Column({ nullable: true })
  esp: string;

  @Column({ nullable: true })
  obs: string;

  @Column({ nullable: true })
  link: string;

  @Column({ type: 'numeric', default: 0 })
  orden: number;

  @ManyToOne(() => User, (user) => user.tasks, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'asignado_a' })
  asignado_a: User | null;

  @CreateDateColumn()
  fecha_creacion: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_asignacion: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  fecha_cierre: Date | null;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Comment, (comment) => comment.tarea)
  comments: Comment[];
}
