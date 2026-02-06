import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName = configService.get<string>('R2_BUCKET_NAME')!;

    // Validación rápida para que no arranque si faltan variables
    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucketName) {
      throw new Error('Error: Faltan variables de entorno de Cloudflare R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY o R2_BUCKET_NAME) en el archivo .env');
    }

    // Inicializamos el cliente S3 apuntando a Cloudflare
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    fileName: string,
  ): Promise<string> {
    // Armamos la ruta final, ej: "dni/12345678-dni-1748291.pdf"
    const key = `${folder}/${fileName}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          // R2 no necesita ACL públicos, se maneja con URLs firmadas
        }),
      );

      // Retornamos el "Key" (la ruta) para guardarlo en la DB de Supabase tal cual como hacías antes
      return key;
    } catch (error) {
      console.error('Error subiendo archivo a R2:', error);
      throw new InternalServerErrorException(`No se pudo subir el archivo a R2: ${error.message}`);
    }
  }

  async createSignedUrl(filePath: string): Promise<string> {
    try {
      // Generamos una URL temporal válida por 1 hora (3600 segundos)
      // Esto es mucho más seguro y rápido que lo de Supabase
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
      return url;
    } catch (error) {
      console.error('Error generando URL firmada R2:', error);
      throw new InternalServerErrorException('Error al generar el link de descarga');
    }
  }
}