import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,     // 1. ¡Importamos el Interceptor!
  UploadedFiles, // 2. ¡Importamos el "atrapa-archivos"!
} from '@nestjs/common';
import { ReclamosService } from './reclamos.service';
import { CreateReclamoDto } from './dto/create-reclamo.dto';
import { UpdateReclamoDto } from './dto/update-reclamo.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express'; // 3. ¡El interceptor específico!

@Controller('reclamos') // Nuestra URL base es /reclamos
export class ReclamosController {
  constructor(private readonly reclamosService: ReclamosService) {}

  // ------------------------------------------------------------------
  // ESTE ES EL ENDPOINT QUE NOS IMPORTA
  // ------------------------------------------------------------------
  @Post() // Escucha en POST /reclamos
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'fileDNI', maxCount: 1 },
      { name: 'fileRecibo', maxCount: 1 },
      { name: 'fileAlta', maxCount: 1 }, // Este es opcional, pero lo aceptamos
      { name: 'fileForm1', maxCount: 1 }, // <-- ¡Descomentado!
      { name: 'fileForm2', maxCount: 1 }, // <-- ¡Descomentado!
    ]),
  )
  create(
    // 5. Los archivos los "atrapamos" con @UploadedFiles()
    @UploadedFiles() files: {
      fileDNI?: Express.Multer.File[],
      fileRecibo?: Express.Multer.File[],
      fileAlta?: Express.Multer.File[],
      fileForm1?: Express.Multer.File[],
      fileForm2?: Express.Multer.File[],
    },
    // 6. Los datos de texto (nombre, dni, email) los atrapamos con @Body()
    @Body() createReclamoDto: CreateReclamoDto,
  ) {
    // 7. Le pasamos todo al "cerebro" (el servicio)
    return this.reclamosService.create(createReclamoDto, files);
  }
  // ------------------------------------------------------------------

  // ------------------------------------------------------------------
  // ¡¡¡NUEVO ENDPOINT PARA EL CLIENTE!!!
  // ------------------------------------------------------------------
  // Va a escuchar en: GET http://localhost:3000/reclamos/consultar/A4F8B1
  @Get('consultar/:codigo')
  consultarPorCodigo(
    @Param('codigo') codigo: string, // "Atrapamos" el código de la URL
  ) {
    // Le pasamos el código al "cerebro" (el service)
    return this.reclamosService.consultarPorCodigo(codigo);
  }
  // ------------------------------------------------------------------

  // (El resto de los endpoints que nos generó Nest por ahora no los tocamos)
  @Get()
  findAll() {
    return this.reclamosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reclamosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReclamoDto: UpdateReclamoDto) {
    return this.reclamosService.update(+id, updateReclamoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reclamosService.remove(+id);
  }
}