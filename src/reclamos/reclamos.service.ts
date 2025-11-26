import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reclamo } from './entities/reclamo.entity';
import { CreateReclamoDto } from './dto/create-reclamo.dto';
import { UpdateReclamoDto } from './dto/update-reclamo.dto';
import { StorageService } from 'src/storage/storage.service';
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { MailService } from 'src/mail/mail.service'; 

const MAX_SIZE_BYTES = 5 * 1024 * 1024; 
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

interface IPathsReclamo {
  dni: 'path_dni';
  recibo: 'path_recibo';
  alta: 'path_alta_medica';
  form1: 'path_form1';
  form2: 'path_form2';
}

@Injectable()
export class ReclamosService {
  
  constructor(
    @InjectRepository(Reclamo)
    private readonly reclamoRepository: Repository<Reclamo>,
    private readonly storageService: StorageService,
    private readonly mailService: MailService, 
  ) {}

  // --- Helper function de "Blindaje" ---
  private async validateFile(file: Express.Multer.File) {
    // 1. Chequeo de Tipo
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      console.error(`Error: Tipo de archivo no permitido: ${file.originalname} (${file.mimetype})`);
      throw new BadRequestException(`Tipo de archivo no permitido: ${file.originalname}. Solo se aceptan PDF, JPG o PNG.`);
    }
    // 2. Chequeo de Tamaño
    if (file.size > MAX_SIZE_BYTES) {
      console.error(`Error: Archivo demasiado grande: ${file.originalname} (${file.size} bytes)`);
      throw new BadRequestException(`Archivo demasiado grande: ${file.originalname}. El límite es 5 MB.`);
    }
  }

  // ------------------------------------------------------------------
  // 1. MÉTODO CREATE (Para "Iniciar Reclamo")
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

    // 1. Validación de Existencia
    if (!files.fileDNI || !files.fileRecibo || !files.fileForm1 || !files.fileForm2) {
      throw new BadRequestException('Faltan uno o más archivos obligatorios');
    }

    // 2. Validación de Tipo y Tamaño
    console.log('Validando archivos...');
    await this.validateFile(files.fileDNI[0]);
    await this.validateFile(files.fileRecibo[0]);
    await this.validateFile(files.fileForm1[0]);
    await this.validateFile(files.fileForm2[0]);
    if (files.fileAlta && files.fileAlta.length > 0) {
      await this.validateFile(files.fileAlta[0]);
    }
    console.log('¡Validación de archivos exitosa!');

    const { dni } = createReclamoDto;

    // 3. Generar Código
    const codigo_seguimiento = randomBytes(3).toString('hex').toUpperCase();
    console.log(`Generando código: ${codigo_seguimiento}`);

    // 4. Subir a Supabase
    console.log('Subiendo archivos a Supabase...');
    const timestamp = Date.now();
    const armarNombreSeguro = (file: Express.Multer.File, campo: string) => {
      const extension = extname(file.originalname);
      return `${dni}-${campo}-${timestamp}${extension}`; 
    };

    const [path_dni, path_recibo, path_form1, path_form2, path_alta_medica] =
      await Promise.all([
        this.storageService.uploadFile(files.fileDNI[0], 'dni', armarNombreSeguro(files.fileDNI[0], 'dni')),
        this.storageService.uploadFile(files.fileRecibo[0], 'recibo', armarNombreSeguro(files.fileRecibo[0], 'recibo')),
        this.storageService.uploadFile(files.fileForm1[0], 'form1', armarNombreSeguro(files.fileForm1[0], 'form1')),
        this.storageService.uploadFile(files.fileForm2[0], 'form2', armarNombreSeguro(files.fileForm2[0], 'form2')),
        files.fileAlta
          ? this.storageService.uploadFile(files.fileAlta[0], 'alta', armarNombreSeguro(files.fileAlta[0], 'alta'))
          : Promise.resolve(null),
      ]);
      
    console.log('¡Archivos subidos con éxito!');

    // 5. Guardar en BD
    const nuevoReclamo = this.reclamoRepository.create({
      ...createReclamoDto,
      codigo_seguimiento,
      estado: 'Recibido',
      path_dni,
      path_recibo,
      path_form1,
      path_form2,
      path_alta_medica: path_alta_medica
    });

    console.log('Guardando registro en MySQL...');
    try {
      await this.reclamoRepository.save(nuevoReclamo);
      console.log('¡Reclamo guardado en BD!');
      
      // ------------------------------------------
      // 6. ¡ENVIAR NOTIFICACIONES POR EMAIL!
      // ------------------------------------------
      // a. Al Cliente
      this.mailService.sendNewReclamoClient(
        createReclamoDto.email, 
        createReclamoDto.nombre, 
        codigo_seguimiento
      ).catch(e => console.error('Error enviando mail cliente:', e));

      // b. Al Admin
      this.mailService.sendNewReclamoAdmin({
        nombre: createReclamoDto.nombre,
        dni: dni,
        codigo_seguimiento: codigo_seguimiento
      }).catch(e => console.error('Error enviando mail admin:', e));
      // ------------------------------------------

    } catch (error) {
      console.error('Error al guardar en BD:', error.message);
      throw new Error(`Error al guardar en Base de Datos: ${error.message}`);
    }

    return {
      message: '¡Reclamo creado con éxito!',
      codigo_seguimiento: codigo_seguimiento,
    };
  }

  // ------------------------------------------------------------------
  // 2. MÉTODO CONSULTAR (Para "Consultar Trámite")
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
  // 3. MÉTODO FINDALL (Para el Dashboard del Admin)
  // ------------------------------------------------------------------
  async findAll(estado?: string) {
    console.log(`[NestJS] Admin solicitó reclamos. Filtro: ${estado || 'Todos'}`);
    
    // 1. Si hay estado, filtramos. Si no, traemos todo.
    const whereCondition = estado ? { estado } : {};

    return this.reclamoRepository.find({
      where: whereCondition,
      order: {
        fecha_creacion: 'DESC', 
      },
    });
  }

  // ------------------------------------------------------------------
  // 4. MÉTODO UPDATE (Para el Modal del Admin)
  // ------------------------------------------------------------------
  async update(
    id: string,
    updateData: { estado: 'Recibido' | 'En Proceso' | 'Finalizado' }, 
  ) {
    console.log(`[NestJS] Admin intentando actualizar el reclamo ${id} a estado ${updateData.estado}`);

    const reclamo = await this.reclamoRepository.findOne({ where: { id } });

    if (!reclamo) {
      throw new NotFoundException(`Reclamo con ID ${id} no encontrado`);
    }

    // Actualizamos
    reclamo.estado = updateData.estado;
    await this.reclamoRepository.save(reclamo);

    console.log(`[NestJS] ¡Reclamo ${id} actualizado!`);

    // ------------------------------------------
    // ¡ENVIAR AVISO AL CLIENTE!
    // ------------------------------------------
    this.mailService.sendStatusUpdate(
      reclamo.email, 
      reclamo.nombre, 
      reclamo.estado
    ).catch(e => console.error('Error enviando mail update:', e));
    // ------------------------------------------

    return reclamo;
  }

  // ------------------------------------------------------------------
  // 5. MÉTODO GET ARCHIVO (Para el Modal del Admin)
  // ------------------------------------------------------------------
  async getArchivoUrl(
    reclamoId: string, 
    tipoArchivo: keyof IPathsReclamo 
  ) {
    console.log(`[ReclamosService] Buscando archivo tipo "${tipoArchivo}" para reclamo ID: ${reclamoId}`);

    const reclamo = await this.reclamoRepository.findOne({ where: { id: reclamoId } });
    if (!reclamo) {
      throw new NotFoundException(`Reclamo con ID ${reclamoId} no encontrado`);
    }

    const pathKey = `path_${tipoArchivo}` as keyof Reclamo;
    const filePath = reclamo[pathKey] as string; 

    if (!filePath) {
      throw new NotFoundException(`El archivo "${tipoArchivo}" no existe para este reclamo.`);
    }

    return this.storageService.createSignedUrl(filePath);
  }

  // ------------------------------------------------------------------
  // 6. (Métodos generados por Nest, corregidos)
  // ------------------------------------------------------------------
  findOne(id: string) { // ¡FIX! (es 'string' UUID)
    return this.reclamoRepository.findOne({ where: { id } });
  }

  remove(id: string) { // ¡FIX! (es 'string' UUID)
    return this.reclamoRepository.delete(id);
  }
}