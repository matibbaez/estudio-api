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

  @Column({ nullable: true }) // <--- AGREGALE ESTO
  path_recibo: string;

  @Column({ nullable: true }) // <--- AGREGALE ESTO
  path_form1: string;

  @Column({ nullable: true }) // <--- AGREGALE ESTO
  path_form2: string;
  
  @Column({ nullable: true }) 
  path_alta_medica: string;

  // --- DATOS DEL TRAMITE ---
  @Column({ nullable: true }) 
  tipo_tramite: string; 

  @Column({ nullable: true }) 
  subtipo_tramite: string;

  // --- CAMPOS NUEVOS PARA RECHAZO (TEXTO) ---
  @Column({ nullable: true })
  jornada_laboral: string;

  @Column({ nullable: true })
  direccion_laboral: string;

  @Column({ nullable: true })
  trayecto_habitual: string;

  // --- ARCHIVOS ESPECÍFICOS ---
  @Column({ nullable: true }) 
  path_carta_documento: string;

  @Column({ nullable: true }) 
  path_revoca_patrocinio: string;
  
  // Nuevo campo booleano para saber facil si tenía abogado
  @Column({ default: false })
  tiene_abogado_anterior: boolean;
}