import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend'; // 1. Importamos Resend

@Injectable()
export class MailService {
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    // 2. Iniciamos Resend con la API KEY
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  // --------------------------------------------------
  // 1. Mail al CLIENTE
  // --------------------------------------------------
  async sendNewReclamoClient(email: string, nombre: string, codigo: string) {
    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev', // Usamos el mail de pruebas de Resend por ahora
        to: email,
        subject: '✅ Recibimos tu Reclamo - Estudio Jurídico',
        html: `
          <h1>Hola ${nombre},</h1>
          <p>Te confirmamos que hemos recibido tu documentación correctamente.</p>
          <p>Tu código de seguimiento es: <strong>${codigo}</strong></p>
          <p>Podés consultar el estado de tu trámite en nuestra web.</p>
        `,
      });
    } catch (error) {
      console.error('Error enviando mail Resend:', error);
    }
  }

  // --------------------------------------------------
  // 2. Mail al ADMIN
  // --------------------------------------------------
  async sendNewReclamoAdmin(datos: any) {
    const adminEmail = 'mfbcaneda@gmail.com'; 
    
    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to: adminEmail,
        subject: '🔔 NUEVO RECLAMO RECIBIDO',
        html: `
          <h2>¡Nuevo trámite ingresado!</h2>
          <ul>
            <li><strong>Cliente:</strong> ${datos.nombre}</li>
            <li><strong>DNI:</strong> ${datos.dni}</li>
            <li><strong>Código:</strong> ${datos.codigo_seguimiento}</li>
          </ul>
        `,
      });
    } catch (error) {
      console.error('Error enviando mail admin Resend:', error);
    }
  }

  // --------------------------------------------------
  // 3. Mail de CAMBIO DE ESTADO
  // --------------------------------------------------
  async sendStatusUpdate(email: string, nombre: string, nuevoEstado: string) {
    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: '📢 Actualización de tu Trámite',
        html: `
          <h1>Hola ${nombre},</h1>
          <p>Te informamos que el estado de tu trámite ha cambiado.</p>
          <h3>Nuevo Estado: <span style="color: blue;">${nuevoEstado}</span></h3>
        `,
      });
    } catch (error) {
      console.error('Error enviando mail update Resend:', error);
    }
  }
}