import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor(private readonly configService: ConfigService) {
    // 1. Configuramos el "Transporte" (Gmail)
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  // --------------------------------------------------
  // 1. Mail al CLIENTE (Confirmación de recepción)
  // --------------------------------------------------
  async sendNewReclamoClient(email: string, nombre: string, codigo: string) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: '✅ Recibimos tu Reclamo - Estudio Jurídico',
      html: `
        <h1>Hola ${nombre},</h1>
        <p>Te confirmamos que hemos recibido tu documentación correctamente.</p>
        <p>Tu código de seguimiento es: <strong>${codigo}</strong></p>
        <p>Podés consultar el estado de tu trámite en nuestra web utilizando este código.</p>
        <br>
        <p>Atentamente,<br>El Equipo del Estudio.</p>
      `,
    });
  }

  // --------------------------------------------------
  // 2. Mail al ESTUDIO (Aviso de nuevo trabajo)
  // --------------------------------------------------
  async sendNewReclamoAdmin(datos: any) {
    
    // ¡ACÁ ESTÁ EL CAMBIO!
    // En lugar de leer del .env, ponemos tu mail directo.
    const adminEmail = 'mfbcaneda@gmail.com'; 
    
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: adminEmail, // ¡Va para vos!
      subject: '🔔 NUEVO RECLAMO RECIBIDO',
      html: `
        <h2>¡Nuevo trámite ingresado!</h2>
        <ul>
          <li><strong>Cliente:</strong> ${datos.nombre}</li>
          <li><strong>DNI:</strong> ${datos.dni}</li>
          <li><strong>Código:</strong> ${datos.codigo_seguimiento}</li>
        </ul>
        <p>Ingresá al panel de administración para ver los archivos.</p>
      `,
    });
  }

  // --------------------------------------------------
  // 3. Mail de CAMBIO DE ESTADO (Update)
  // --------------------------------------------------
  async sendStatusUpdate(email: string, nombre: string, nuevoEstado: string) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: '📢 Actualización de tu Trámite',
      html: `
        <h1>Hola ${nombre},</h1>
        <p>Te informamos que el estado de tu trámite ha cambiado.</p>
        <h3>Nuevo Estado: <span style="color: blue;">${nuevoEstado}</span></h3>
        <p>Seguimos trabajando en tu caso.</p>
      `,
    });
  }
}