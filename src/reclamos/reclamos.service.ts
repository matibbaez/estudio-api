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
  ) {}

  private async validateFile(file: Express.Multer.File) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo de archivo no permitido: ${file.originalname}. Solo PDF, JPG, PNG.`);
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException(`Archivo demasiado grande: ${file.originalname}. Límite 5 MB.`);
    }
  }

  async create(createReclamoDto: CreateReclamoDto, files: any) {
    
    // Validaciones básicas
    if (!files.fileDNI || !files.fileRecibo || !files.fileForm1 || !files.fileForm2) {
      throw new BadRequestException('Faltan archivos obligatorios');
    }

    // Validar cada archivo
    await this.validateFile(files.fileDNI[0]);
    await this.validateFile(files.fileRecibo[0]);
    await this.validateFile(files.fileForm1[0]);
    await this.validateFile(files.fileForm2[0]);
    if (files.fileAlta?.[0]) await this.validateFile(files.fileAlta[0]);
    if (files.fileCartaDocumento?.[0]) await this.validateFile(files.fileCartaDocumento[0]);
    if (files.fileRevoca?.[0]) await this.validateFile(files.fileRevoca[0]);

    const { dni } = createReclamoDto;
    const codigo_seguimiento = randomBytes(3).toString('hex').toUpperCase();
    const timestamp = Date.now();
    
    const armarNombre = (file: Express.Multer.File, campo: string) => 
      `${dni}-${campo}-${timestamp}${extname(file.originalname)}`;

    // Subida paralela de obligatorios
    const [path_dni, path_recibo, path_form1, path_form2] = await Promise.all([
        this.storageService.uploadFile(files.fileDNI[0], 'dni', armarNombre(files.fileDNI[0], 'dni')),
        this.storageService.uploadFile(files.fileRecibo[0], 'recibo', armarNombre(files.fileRecibo[0], 'recibo')),
        this.storageService.uploadFile(files.fileForm1[0], 'form1', armarNombre(files.fileForm1[0], 'form1')),
        this.storageService.uploadFile(files.fileForm2[0], 'form2', armarNombre(files.fileForm2[0], 'form2')),
    ]);

    // --- CORRECCIÓN ACÁ: TIPADO EXPLÍCITO ---
    let path_alta_medica: string | null = null;
    if (files.fileAlta?.[0]) {
      path_alta_medica = await this.storageService.uploadFile(files.fileAlta[0], 'alta', armarNombre(files.fileAlta[0], 'alta'));
    }

    let path_carta_documento: string | null = null;
    if (files.fileCartaDocumento?.[0]) {
      path_carta_documento = await this.storageService.uploadFile(files.fileCartaDocumento[0], 'carta_doc', armarNombre(files.fileCartaDocumento[0], 'carta_doc'));
    }

    let path_revoca_patrocinio: string | null = null;
    if (files.fileRevoca?.[0]) {
      path_revoca_patrocinio = await this.storageService.uploadFile(files.fileRevoca[0], 'revoca', armarNombre(files.fileRevoca[0], 'revoca'));
    }

    // Guardar en BD
    const nuevoReclamo = this.reclamoRepository.create({
      ...createReclamoDto,
      codigo_seguimiento,
      estado: 'Recibido',
      path_dni,
      path_recibo,
      path_form1,
      path_form2,
      path_alta_medica,
      path_carta_documento,
      path_revoca_patrocinio
    } as any);

    await this.reclamoRepository.save(nuevoReclamo);

    // Mails (sin await para no trabar)
    this.mailService.sendNewReclamoClient(createReclamoDto.email, createReclamoDto.nombre, codigo_seguimiento).catch(console.error);
    this.mailService.sendNewReclamoAdmin({ nombre: createReclamoDto.nombre, dni, codigo_seguimiento }).catch(console.error);

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

  async getArchivoUrl(id: string, tipo: keyof IPathsReclamo) {
    const reclamo = await this.reclamoRepository.findOne({ where: { id } });
    if (!reclamo) throw new NotFoundException('Reclamo no encontrado');
    const pathKey = `path_${tipo}` as keyof Reclamo;
    const path = reclamo[pathKey] as string;
    if (!path) throw new NotFoundException('Archivo no existe');
    return this.storageService.createSignedUrl(path);
  }

  findOne(id: string) { return this.reclamoRepository.findOne({ where: { id } }); }
  remove(id: string) { return this.reclamoRepository.delete(id); }
}