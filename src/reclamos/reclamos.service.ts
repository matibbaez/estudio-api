import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reclamo } from './entities/reclamo.entity';
import { CreateReclamoDto } from './dto/create-reclamo.dto';
import { UpdateReclamoDto } from './dto/update-reclamo.dto';
import { StorageService } from 'src/storage/storage.service';
import { randomBytes } from 'crypto';
import { extname } from 'path'; // 1. ¡IMPORTAMOS 'extname' PARA SACAR LA EXTENSIÓN!

@Injectable()
export class ReclamosService {
  
  constructor(
    @InjectRepository(Reclamo)
    private readonly reclamoRepository: Repository<Reclamo>,
    private readonly storageService: StorageService,
  ) {}

  // ------------------------------------------------------------------
  // ¡EL MÉTODO CREATE DEFINITIVO!
  // ------------------------------------------------------------------
  async create(
    createReclamoDto: CreateReclamoDto,
    files: {
      fileDNI?: Express.Multer.File[];
      fileRecibo?: Express.Multer.File[];
      fileAlta?: Express.Multer.File[];
      fileForm1?: Express.Multer.File[];
      fileForm2?: Express.Multer.File[];
    },
  ) {
    
    console.log('--- ¡NUEVO RECLAMO RECIBIDO! ---');
    console.log('DATOS DE TEXTO (DTO):', createReclamoDto);

    // --- 1. Validación de Archivos (Paso Pro) ---
    if (!files.fileDNI || !files.fileRecibo || !files.fileForm1 || !files.fileForm2) {
      throw new BadRequestException('Faltan uno o más archivos obligatorios');
    }

    const { dni } = createReclamoDto;

    // --- 2. Generar Código de Seguimiento Único ---
    const codigo_seguimiento = randomBytes(3).toString('hex').toUpperCase(); // Ej: "A4F8B1"
    console.log(`Generando código: ${codigo_seguimiento}`);

    // --- 3. Subir Archivos a la Bóveda (Supabase) ---
    console.log('Subiendo archivos a Supabase...');
    
    // --- ¡INICIO DEL FIX! ---
    const timestamp = Date.now(); // Timestamp único para este reclamo

    // Helper function para crear un nombre 100% seguro
    const armarNombreSeguro = (file: Express.Multer.File, campo: string) => {
      const extension = extname(file.originalname); // Saca ".pdf" o ".jpg"
      // Genera: "46579888-dni-123456789.pdf"
      return `${dni}-${campo}-${timestamp}${extension}`; 
    };

    // (Usamos "Promise.all" para subirlos todos al mismo tiempo)
    const [path_dni, path_recibo, path_form1, path_form2, path_alta_medica] =
      await Promise.all([
        // ¡Usamos el nombre seguro!
        this.storageService.uploadFile(files.fileDNI[0], 'dni', armarNombreSeguro(files.fileDNI[0], 'dni')),
        this.storageService.uploadFile(files.fileRecibo[0], 'recibo', armarNombreSeguro(files.fileRecibo[0], 'recibo')),
        this.storageService.uploadFile(files.fileForm1[0], 'form1', armarNombreSeguro(files.fileForm1[0], 'form1')),
        this.storageService.uploadFile(files.fileForm2[0], 'form2', armarNombreSeguro(files.fileForm2[0], 'form2')),
        
        // Manejador ternario para el archivo opcional
        files.fileAlta
          ? this.storageService.uploadFile(files.fileAlta[0], 'alta', armarNombreSeguro(files.fileAlta[0], 'alta'))
          : Promise.resolve(null), // Si no existe, devuelve null
      ]);
    // --- ¡FIN DEL FIX! ---
      
    console.log('¡Archivos subidos con éxito!');

    // --- 4. Crear el "Molde" para la BD ---
    const nuevoReclamo = this.reclamoRepository.create({
      ...createReclamoDto, // nombre, dni, email
      codigo_seguimiento,
      estado: 'Recibido', // ¡Estado inicial!
      path_dni,
      path_recibo,
      path_form1,
      path_form2,
      path_alta_medica: path_alta_medica
    });

    // --- 5. Guardar en la Base de Datos (MySQL) ---
    console.log('Guardando registro en MySQL...');
    try {
      await this.reclamoRepository.save(nuevoReclamo);
      console.log('¡Reclamo guardado en BD!');
    } catch (error) {
      // Manejar error de DNI duplicado, o código de seguimiento duplicado, etc.
      console.error('Error al guardar en BD:', error.message);
      throw new Error(`Error al guardar en Base de Datos: ${error.message}`);
    }

    // --- 6. Devolver el Código al Frontend ---
    return {
      message: '¡Reclamo creado con éxito!',
      codigo_seguimiento: codigo_seguimiento,
    };
  }

  // ------------------------------------------------------------------
  // ¡NUEVA LÓGICA DE BÚSQUEDA! (Esta la dejamos como estaba)
  // ------------------------------------------------------------------
  async consultarPorCodigo(codigo: string) {
    if (!codigo) {
      throw new BadRequestException('El código no puede estar vacío');
    }

    console.log(`[NestJS] Buscando trámite con código: ${codigo}`);

    const reclamo = await this.reclamoRepository.findOne({
      where: { codigo_seguimiento: codigo }, 
    });

    if (!reclamo) {
      console.log(`[NestJS] Código ${codigo} no encontrado.`);
      throw new NotFoundException('Código de seguimiento no encontrado');
    }

    console.log(`[NestJS] ¡Trámite encontrado! Estado: ${reclamo.estado}`);
    
    return {
      codigo_seguimiento: reclamo.codigo_seguimiento,
      estado: reclamo.estado,
      fecha_creacion: reclamo.fecha_creacion,
    };
  }

  // ------------------------------------------------------------------
  // (El resto de los métodos por ahora no los tocamos)
  // ------------------------------------------------------------------
  async findAll() {
    console.log('[NestJS] Admin solicitó TODOS los reclamos');
    
    // ¡La magia de TypeORM!
    // Busca en la tabla 'reclamos' y traelos todos,
    // ordenados por fecha de creación (el más nuevo primero).
    return this.reclamoRepository.find({
      order: {
        fecha_creacion: 'DESC',
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} reclamo`;
  }

  async update(
    id: string, // ¡OJO! Es 'string' (UUID), no 'number'
    // Solo vamos a permitir que actualicen el 'estado'
    updateData: { estado: 'Recibido' | 'En Proceso' | 'Finalizado' }, 
  ) {
    console.log(`[NestJS] Admin intentando actualizar el reclamo ${id} a estado ${updateData.estado}`);

    // 1. Buscamos el reclamo por su ID (UUID)
    const reclamo = await this.reclamoRepository.findOne({ where: { id } });

    // 2. Si no existe, tiramos error
    if (!reclamo) {
      throw new NotFoundException(`Reclamo con ID ${id} no encontrado`);
    }

    // 3. Actualizamos el estado
    reclamo.estado = updateData.estado;

    // 4. Guardamos los cambios en la BD
    await this.reclamoRepository.save(reclamo);

    console.log(`[NestJS] ¡Reclamo ${id} actualizado!`);
    return reclamo; // Devolvemos el reclamo actualizado
  }

  remove(id: number) {
    return `This action removes a #${id} reclamo`;
  }
}