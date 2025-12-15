import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reclamo } from './entities/reclamo.entity';
import { CreateReclamoDto } from './dto/create-reclamo.dto';
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
  carta_documento: 'path_carta_documento';
  revoca: 'path_revoca_patrocinio';
}

@Injectable()
export class ReclamosService {

  constructor(
    @InjectRepository(Reclamo)
    private readonly reclamoRepository: Repository<Reclamo>,
    private readonly storageService: StorageService,
    private readonly mailService: MailService,
  ) { }

  private async validateFile(file: Express.Multer.File) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo de archivo no permitido: ${file.originalname}. Solo PDF, JPG, PNG.`);
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException(`Archivo demasiado grande: ${file.originalname}. Límite 5 MB.`);
    }
  }

  async create(createReclamoDto: CreateReclamoDto, files: any) {

    // 1. VALIDACIÓN DINÁMICA DE ARCHIVOS (SEGÚN EL TIPO DE TRÁMITE) 🛡️
    const tipo = createReclamoDto.tipo_tramite;

    // A. DNI SIEMPRE OBLIGATORIO
    if (!files.fileDNI) throw new BadRequestException('Falta el DNI.');

    // B. VALIDACIÓN POR TIPO
    if (tipo === 'Medico') {
      // Médico: Pide Alta.
      if (!files.fileAlta) throw new BadRequestException('Falta el Alta Médica.');
    }
    else if (tipo === 'Incapacidad') {
      // Incapacidad: Pide TODO.
      if (!files.fileAlta) throw new BadRequestException('Falta el Alta Médica.');
      if (!files.fileRecibo) throw new BadRequestException('Falta el Recibo de Sueldo.');
      if (!files.fileForm1) throw new BadRequestException('Falta el Formulario 1.');
      if (!files.fileForm2) throw new BadRequestException('Falta el Formulario 2.');
    }
    else if (tipo === 'Rechazo') {
      // Rechazo: Pide Carta, Recibo, Forms. NO Alta.
      if (!files.fileCartaDocumento) throw new BadRequestException('Falta la Carta Documento.');
      if (!files.fileRecibo) throw new BadRequestException('Falta el Recibo de Sueldo.');
      if (!files.fileForm1) throw new BadRequestException('Falta el Formulario 1.');
      if (!files.fileForm2) throw new BadRequestException('Falta el Formulario 2.');
    }

    // C. VALIDACIÓN ABOGADO ANTERIOR (REVOCA)
    // El DTO ya validamos que es string 'true' o 'false'
    if (createReclamoDto.tiene_abogado_anterior === 'true') {
      if (!files.fileRevoca) throw new BadRequestException('Falta la carta de Revoca.');
    }

    // 2. VALIDAR PESO Y TIPO DE CADA ARCHIVO QUE HAYA LLEGADO
    const todosLosArchivos = [
      files.fileDNI?.[0],
      files.fileRecibo?.[0],
      files.fileForm1?.[0],
      files.fileForm2?.[0],
      files.fileAlta?.[0],
      files.fileCartaDocumento?.[0],
      files.fileRevoca?.[0]
    ];

    for (const file of todosLosArchivos) {
      if (file) await this.validateFile(file);
    }

    // 3. SUBIDA A STORAGE (SOLO SI EXISTEN)
    const { dni } = createReclamoDto;
    const codigo_seguimiento = randomBytes(3).toString('hex').toUpperCase();
    const timestamp = Date.now();

    const armarNombre = (file: Express.Multer.File, campo: string) =>
      `${dni}-${campo}-${timestamp}${extname(file.originalname)}`;

    // Subimos uno por uno los que existan (más seguro que Promise.all fijo)
    // DNI es obligatorio, así que siempre tendrá valor string
    const path_dni = await this.storageService.uploadFile(files.fileDNI[0], 'dni', armarNombre(files.fileDNI[0], 'dni'));

    // --- Subidas opcionales (FIX DE TIPADO) ---
    // Definimos explícitamente el tipo: string | null para evitar el error TS2322

    let path_recibo: string | null = null;
    if (files.fileRecibo) {
      path_recibo = await this.storageService.uploadFile(files.fileRecibo[0], 'recibo', armarNombre(files.fileRecibo[0], 'recibo'));
    }

    let path_form1: string | null = null;
    if (files.fileForm1) {
      path_form1 = await this.storageService.uploadFile(files.fileForm1[0], 'form1', armarNombre(files.fileForm1[0], 'form1'));
    }

    let path_form2: string | null = null;
    if (files.fileForm2) {
      path_form2 = await this.storageService.uploadFile(files.fileForm2[0], 'form2', armarNombre(files.fileForm2[0], 'form2'));
    }

    let path_alta_medica: string | null = null;
    if (files.fileAlta) {
      path_alta_medica = await this.storageService.uploadFile(files.fileAlta[0], 'alta', armarNombre(files.fileAlta[0], 'alta'));
    }

    let path_carta_documento: string | null = null;
    if (files.fileCartaDocumento) {
      path_carta_documento = await this.storageService.uploadFile(files.fileCartaDocumento[0], 'carta_doc', armarNombre(files.fileCartaDocumento[0], 'carta_doc'));
    }

    let path_revoca_patrocinio: string | null = null;
    if (files.fileRevoca) {
      path_revoca_patrocinio = await this.storageService.uploadFile(files.fileRevoca[0], 'revoca', armarNombre(files.fileRevoca[0], 'revoca'));
    }


    // 4. GUARDAR EN BD
    const nuevoReclamo = this.reclamoRepository.create({
      ...createReclamoDto,
      tiene_abogado_anterior: createReclamoDto.tiene_abogado_anterior === 'true', // Convertir a boolean
      codigo_seguimiento,
      estado: 'Recibido',
      path_dni,
      path_recibo,         // Puede ser null
      path_form1,          // Puede ser null
      path_form2,          // Puede ser null
      path_alta_medica,    // Puede ser null
      path_carta_documento,// Puede ser null
      path_revoca_patrocinio // Puede ser null
    } as any); // as any para evitar líos con tipos opcionales de TypeORM si no están marcados como nullable

    await this.reclamoRepository.save(nuevoReclamo);

    // 5. EMAILS
    this.mailService.sendNewReclamoClient(createReclamoDto.email, createReclamoDto.nombre, codigo_seguimiento).catch(console.error);
    this.mailService.sendNewReclamoAdmin({
      nombre: createReclamoDto.nombre,
      dni,
      codigo_seguimiento,
      tipo: createReclamoDto.tipo_tramite
    }).catch(console.error);

    return { message: '¡Éxito!', codigo_seguimiento };
  }

  // --- RESTO DE MÉTODOS IGUALES ---

  async consultarPorCodigo(codigo: string) {
    const reclamo = await this.reclamoRepository.findOne({ where: { codigo_seguimiento: codigo } });
    if (!reclamo) throw new NotFoundException('Código no encontrado');
    return { codigo_seguimiento: reclamo.codigo_seguimiento, estado: reclamo.estado, fecha_creacion: reclamo.fecha_creacion };
  }

  async findAll(estado?: string) {
    const where = estado ? { estado } : {};
    return this.reclamoRepository.find({ where, order: { fecha_creacion: 'DESC' } });
  }

  async update(id: string, body: any) {
    const reclamo = await this.reclamoRepository.findOne({ where: { id } });
    if (!reclamo) throw new NotFoundException('No encontrado');
    reclamo.estado = body.estado;
    await this.reclamoRepository.save(reclamo);
    this.mailService.sendStatusUpdate(reclamo.email, reclamo.nombre, reclamo.estado).catch(console.error);
    return reclamo;
  }

  async getArchivoUrl(reclamoId: string, tipoArchivo: string) {

    // console.log(`[ReclamosService] Solicitud de descarga: ID=${reclamoId}, TIPO=${tipoArchivo}`);

    const mapaColumnas: Record<string, keyof Reclamo> = {
      'dni': 'path_dni',
      'recibo': 'path_recibo',
      'form1': 'path_form1',
      'form2': 'path_form2',
      'alta': 'path_alta_medica',
      'carta_documento': 'path_carta_documento',
      'revoca': 'path_revoca_patrocinio'
    };

    const columnaBd = mapaColumnas[tipoArchivo];

    if (!columnaBd) {
      throw new BadRequestException(`El tipo de archivo '${tipoArchivo}' no es válido.`);
    }

    const reclamo = await this.reclamoRepository.findOne({ where: { id: reclamoId } });

    if (!reclamo) {
      throw new NotFoundException(`Reclamo con ID ${reclamoId} no encontrado`);
    }

    const filePath = reclamo[columnaBd] as string;

    if (!filePath) {
      console.error(`[Error] El archivo no existe en la columna ${columnaBd}`);
      throw new NotFoundException(`El archivo no existe para este reclamo.`);
    }

    // Generamos la URL firmada
    return this.storageService.createSignedUrl(filePath);
  }

  findOne(id: string) { return this.reclamoRepository.findOne({ where: { id } }); }
  remove(id: string) { return this.reclamoRepository.delete(id); }
}