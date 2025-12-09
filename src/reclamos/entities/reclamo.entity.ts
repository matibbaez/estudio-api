import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('reclamos')
export class Reclamo {
  
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column()
  dni: string;

  @Column()
  email: string;

  @Column({ unique: true })
  codigo_seguimiento: string;

  @Column({ default: 'Recibido' })
  estado: string; 

  @CreateDateColumn()
  fecha_creacion: Date;

  // --- ARCHIVOS BASE ---
  @Column() 
  path_dni: string;
  
  @Column() 
  path_recibo: string;
  
  @Column() 
  path_form1: string;
  
  @Column() 
  path_form2: string;
  
  @Column({ nullable: true }) 
  path_alta_medica: string;

  @Column({ nullable: true }) 
  tipo_tramite: string; 

  @Column({ nullable: true }) 
  subtipo_tramite: string;

  @Column({ nullable: true }) 
  path_carta_documento: string;

  @Column({ nullable: true }) 
  path_revoca_patrocinio: string;
}