import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('reclamos') 
export class Reclamo {
  @PrimaryGeneratedColumn('uuid') 
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 20 })
  dni: string;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ type: 'varchar', length: 10, unique: true }) 
  codigo_seguimiento: string;

  @Column({
    type: 'enum',
    enum: ['Recibido', 'En Proceso', 'Finalizado'],
    default: 'Recibido',
  })
  estado: string;

  @Column({ type: 'text' })
  path_dni: string;

  @Column({ type: 'text' })
  path_recibo: string;

  @Column({ type: 'text', nullable: true }) 
  path_alta_medica: string | null; 

  @Column({ type: 'text' })
  path_form1: string;

  @Column({ type: 'text' })
  path_form2: string;

  @CreateDateColumn() 
  fecha_creacion: Date;

  @Column({ nullable: true })
  tipo_tramite: string; // 'Alta Medica', 'Rechazo', 'Prestaciones'

  @Column({ nullable: true })
  subtipo_tramite: string; // 'Div. Alta', 'Div. Prestaciones', 'Reingreso' (Solo si es Prestaciones)

  @Column({ nullable: true })
  path_carta_documento: string; // Solo si es Rechazo

  @Column({ nullable: true })
  path_revoca_patrocinio: string; // Solo si vino del banner especial
}