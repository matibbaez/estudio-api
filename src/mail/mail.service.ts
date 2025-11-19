import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;

  // Colores de la marca (para usarlos en el HTML)
  private colors = {
    primary: '#1a237e', // El azul oscuro del sitio
    accent: '#28a745',  // Verde para éxito
    text: '#333333',
    bg: '#f4f4f4',
    white: '#ffffff'
  };

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      console.error('❌ ERROR: Falta RESEND_API_KEY');
    }
    this.resend = new Resend(apiKey);
  }

  // =================================================================
  // 🎨 EL "ENVOLTORIO" PREMIUM (Plantilla Base)
  // =================================================================
  private getHtmlTemplate(titulo: string, contenido: string, boton?: { texto: string, link: string }) {
    // Si hay botón, generamos el HTML del botón
    const botonHtml = boton ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${boton.link}" style="background-color: ${this.colors.primary}; color: ${this.colors.white}; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
          ${boton.texto}
        </a>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${this.colors.bg}; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: ${this.colors.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-top: 20px; margin-bottom: 20px; }
          .header { background-color: ${this.colors.primary}; color: ${this.colors.white}; padding: 20px; text-align: center; }
          .content { padding: 30px; color: ${this.colors.text}; line-height: 1.6; font-size: 16px; }
          .footer { background-color: #eeeeee; padding: 15px; text-align: center; font-size: 12px; color: #888; }
          .label { font-weight: bold; color: #555; }
          .value { font-family: monospace; background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 1.1em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">Estudio Jurídico</h2>
          </div>
          <div class="content">
            <h2 style="color: ${this.colors.primary}; margin-top: 0;">${titulo}</h2>
            ${contenido}
            ${botonHtml}
          </div>
          <div class="footer">
            <p>Este es un mensaje automático, por favor no responder.</p>
            <p>&copy; 2025 Estudio Jurídico. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // =================================================================
  // 1. MAIL AL CLIENTE (Confirmación)
  // =================================================================
  async sendNewReclamoClient(email: string, nombre: string, codigo: string) {
    const contenido = `
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Te confirmamos que hemos recibido tu documentación correctamente y ya se encuentra en nuestro sistema seguro.</p>
      
      <div style="background-color: #e8eaf6; padding: 15px; border-radius: 5px; border-left: 4px solid ${this.colors.primary}; margin: 20px 0;">
        <p style="margin: 0; font-size: 0.9em; color: #555;">TU CÓDIGO DE SEGUIMIENTO:</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: ${this.colors.primary}; letter-spacing: 2px;">${codigo}</p>
      </div>

      <p>Podés utilizar este código en nuestra web para ver el avance de tu trámite en cualquier momento.</p>
    `;

    const html = this.getHtmlTemplate('¡Recibimos tu Reclamo!', contenido, {
      texto: 'Consultar Estado',
      link: 'https://tusitio.com/consultar-tramite' // ¡PONE TU URL REAL ACÁ!
    });

    await this.sendEmail(email, '✅ Reclamo Iniciado Exitosamente', html);
  }

  // =================================================================
  // 2. MAIL AL ADMIN (Aviso de nuevo trabajo)
  // =================================================================
  async sendNewReclamoAdmin(datos: any) {
    const contenido = `
      <p>Se ha ingresado un nuevo trámite a través del portal web.</p>
      <ul style="list-style: none; padding: 0;">
        <li style="margin-bottom: 10px;"><span class="label">Cliente:</span> ${datos.nombre}</li>
        <li style="margin-bottom: 10px;"><span class="label">DNI:</span> ${datos.dni}</li>
        <li style="margin-bottom: 10px;"><span class="label">Código:</span> <span class="value">${datos.codigo_seguimiento}</span></li>
      </ul>
      <p>Los archivos ya están disponibles en la bóveda digital.</p>
    `;

    const html = this.getHtmlTemplate('🔔 Nuevo Trámite Recibido', contenido, {
      texto: 'Ir al Panel de Admin',
      link: 'https://tusitio.com/login' // ¡PONE TU URL REAL ACÁ!
    });

    await this.sendEmail('mfbcaneda@gmail.com', `🔔 Nuevo: ${datos.nombre}`, html);
  }

  // =================================================================
  // 3. MAIL DE CAMBIO DE ESTADO (Update)
  // =================================================================
  async sendStatusUpdate(email: string, nombre: string, nuevoEstado: string) {
    
    // Definimos un color según el estado
    let colorEstado = this.colors.primary;
    if (nuevoEstado === 'En Proceso') colorEstado = '#f57c00'; // Naranja
    if (nuevoEstado === 'Finalizado') colorEstado = '#28a745'; // Verde

    const contenido = `
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Queríamos informarte que hubo novedades en tu gestión.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="margin-bottom: 5px; color: #777;">NUEVO ESTADO:</p>
        <span style="display: inline-block; padding: 8px 16px; background-color: ${colorEstado}; color: white; border-radius: 20px; font-weight: bold; font-size: 18px;">
          ${nuevoEstado.toUpperCase()}
        </span>
      </div>

      <p>El equipo del estudio sigue trabajando en tu caso.</p>
    `;

    const html = this.getHtmlTemplate('📢 Actualización de Estado', contenido, {
      texto: 'Ver Detalles',
      link: 'https://tusitio.com/consultar-tramite'
    });

    await this.sendEmail(email, `Tu trámite está: ${nuevoEstado}`, html);
  }

  // --- Helper Genérico de Envío ---
  private async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to: to,
        subject: subject,
        html: html,
      });
      console.log(`✅ Mail enviado a ${to}`);
    } catch (error) {
      console.error('❌ Error enviando mail:', error);
    }
  }
}