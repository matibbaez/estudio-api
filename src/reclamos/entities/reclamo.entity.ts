import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('reclamos') // <-- Este será el nombre de la tabla en MySQL
export class Reclamo {
  @PrimaryGeneratedColumn('uuid') // <-- Usamos 'uuid' para generar un ID de texto
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 20 })
  dni: string;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ type: 'varchar', length: 10, unique: true }) // <-- ¡único!
  codigo_seguimiento: string;

  @Column({
    type: 'enum',
    enum: ['Recibido', 'En Proceso', 'Finalizado'],
    default: 'Recibido',
  })
  estado: string;

  // --- Paths a los archivos en la Bóveda (Supabase) ---
  // (Los guardamos como texto)
  @Column({ type: 'text' })
  path_dni: string;

  @Column({ type: 'text' })
  path_recibo: string;

  @Column({ type: 'text', nullable: true }) // <-- nullable: true = opcional
  path_alta_medica: string | null; // <-- ¡LE AGREGAMOS EL | null !

  @Column({ type: 'text' })
  path_form1: string;

  @Column({ type: 'text' })
  path_form2: string;

  @CreateDateColumn() // <-- TypeORM pone la fecha de creación automáticamente
  fecha_creacion: Date;
}