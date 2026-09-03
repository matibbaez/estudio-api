import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query
} from '@nestjs/common';
import { ReclamosService } from './reclamos.service';
import { CreateReclamoDto } from './dto/create-reclamo.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

// Interface Helper (para el tipo de archivo)
interface IPathsReclamo {
  dni: 'path_dni';
  recibo: 'path_recibo';
  alta: 'path_alta_medica';
  formSRT: 'path_form_srt';
  carta_documento: 'path_carta_documento';
  revoca: 'path_revoca_patrocinio';
}

@Controller('reclamos') // URL base: /reclamos
export class ReclamosController {
  constructor(private readonly reclamosService: ReclamosService) {}

  // ------------------------------------------------------------------
  // 1. ENDPOINT: "INICIAR RECLAMO" (Público)
  // ------------------------------------------------------------------
  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'fileDNI', maxCount: 1 },
    { name: 'fileRecibo', maxCount: 1 },
    { name: 'fileFormSRT', maxCount: 1 },
    { name: 'fileAlta', maxCount: 1 },
    { name: 'fileCartaDocumento', maxCount: 1 },
    { name: 'fileRevoca', maxCount: 1 }, 
  ]))
  async create(
    @Body() createReclamoDto: CreateReclamoDto,
    @UploadedFiles() files: { 
      fileDNI?: Express.Multer.File[], 
      fileRecibo?: Express.Multer.File[], 
      fileFormSRT?: Express.Multer.File[], 
      fileAlta?: Express.Multer.File[],
      fileCartaDocumento?: Express.Multer.File[],
      fileRevoca?: Express.Multer.File[]
    },
  ) {
    return this.reclamosService.create(createReclamoDto, files);
  }

  // ------------------------------------------------------------------
  // 2. ENDPOINT: "CONSULTAR TRÁMITE" (Público)
  // ------------------------------------------------------------------
  @Get('consultar/:codigo')
  consultarPorCodigo(@Param('codigo') codigo: string) {
    return this.reclamosService.consultarPorCodigo(codigo);
  }

  // ------------------------------------------------------------------
  // 3. ENDPOINT: "VER TODOS" (Admin Dashboard)
  // ------------------------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('estado') estado?: string) {
    return this.reclamosService.findAll(estado);
  }

  // ------------------------------------------------------------------
  // 4. ENDPOINT: "ACTUALIZAR ESTADO" (Admin Modal)
  // ------------------------------------------------------------------
  @UseGuards(JwtAuthGuard) 
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { estado: string }, // <-- Cambialo a string genérico por ahora
  ) {
    return this.reclamosService.update(id, body);
  }

  // ------------------------------------------------------------------
  // 5. ENDPOINT: "DESCARGAR ARCHIVO" (Admin Modal)
  // ------------------------------------------------------------------
  @UseGuards(JwtAuthGuard) 
  @Get('descargar/:id/:tipo')
  async descargarArchivo(
    @Param('id') id: string,
    @Param('tipo') tipo: keyof IPathsReclamo,
  ) {
    const urlTemporal = await this.reclamosService.getArchivoUrl(id, tipo);
    return { url: urlTemporal };
  }

  // ------------------------------------------------------------------
  // (Métodos generados por Nest, corregidos)
  // ------------------------------------------------------------------
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reclamosService.findOne(id); 
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reclamosService.remove(id); 
  }
}