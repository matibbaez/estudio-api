import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;

  // PALETA DE COLORES
  private colors = {
    primary: '#1a237e',   
    secondary: '#303f9f', 
    success: '#00c853',   
    warning: '#ffab00',   
    text: '#2c3e50',      
    gray: '#f5f7fa',      
    white: '#ffffff',
    border: '#e1e4e8'
  };

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      console.error('❌ ERROR: Falta RESEND_API_KEY');
    }
    this.resend = new Resend(apiKey);
  }

  // =================================================================
  // 🖌️ PLANTILLA MAESTRA DE DISEÑO (Responsive & Clean)
  // =================================================================
  private getHtmlTemplate(titulo: string, contenido: string, boton?: { texto: string, link: string }, preheader?: string) {
    
    // Botón con diseño "Material Design"
    const botonHtml = boton ? `
      <tr>
        <td align="center" style="padding-top: 30px; padding-bottom: 20px;">
          <a href="${boton.link}" target="_blank" style="
            background-color: ${this.colors.primary};
            color: ${this.colors.white};
            padding: 14px 30px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 50px;
            box-shadow: 0 4px 6px rgba(26, 35, 126, 0.2);
            display: inline-block;
            font-family: 'Helvetica Neue', Arial, sans-serif;
          ">
            ${boton.texto} &rarr;
          </a>
        </td>
      </tr>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${titulo}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: ${this.colors.gray}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        
        <div style="display: none; max-height: 0; overflow: hidden;">
          ${preheader || titulo}
        </div>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${this.colors.gray}; padding: 40px 0;">
          <tr>
            <td align="center">
              
              <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: ${this.colors.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); max-width: 90%;">
                
                <tr>
                  <td align="center" style="background-color: ${this.colors.primary}; padding: 30px;">
                    <h1 style="color: ${this.colors.white}; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 700;">RECLAMARTE</h1>
                    <p style="color: rgba(255,255,255,0.7); margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Estudio Jurídico Digital</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px 40px 20px 40px;">
                    <h2 style="color: ${this.colors.primary}; margin-top: 0; font-size: 22px; font-weight: 700;">${titulo}</h2>
                    <div style="color: ${this.colors.text}; font-size: 16px; line-height: 1.6;">
                      ${contenido}
                    </div>
                  </td>
                </tr>

                ${botonHtml}

                <tr>
                  <td style="padding: 0 40px;">
                    <div style="border-top: 1px solid ${this.colors.border}; margin-top: 20px;"></div>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding: 30px; background-color: ${this.colors.white};">
                    <p style="color: #999; font-size: 12px; margin: 0; line-height: 1.5;">
                      Este es un mensaje automático enviado desde <strong>Reclamarte.ar</strong>.<br>
                      Por favor no respondas a este correo. Si necesitas ayuda, contáctanos por los canales oficiales.
                    </p>
                    <p style="color: #ccc; font-size: 11px; margin-top: 10px;">
                      &copy; 2025 Reclamarte. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>

              </table>
              </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  // =================================================================
  // 1. MAIL AL CLIENTE (Confirmación de Recepción)
  // =================================================================
  async sendNewReclamoClient(email: string, nombre: string, codigo: string) {
    const contenido = `
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>¡Buenas noticias! Hemos recibido tu documentación correctamente. Tu caso ya ingresó a nuestra <strong>Bóveda Digital Segura</strong>.</p>
      
      <div style="background-color: #f8f9fa; border: 1px solid ${this.colors.border}; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">TU CÓDIGO DE SEGUIMIENTO</p>
        <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: 800; color: ${this.colors.primary}; letter-spacing: 3px; font-family: monospace;">${codigo}</p>
      </div>

      <p style="font-size: 14px; color: #666;">
        💡 <strong>Tip:</strong> Guardá este código. Es la llave única para ver cómo avanza tu trámite en tiempo real desde nuestra web.
      </p>
    `;

    const html = this.getHtmlTemplate(
      '¡Trámite Iniciado!', 
      contenido, 
      { texto: 'Seguir mi Trámite', link: 'https://reclamarte.ar/consultar-tramite' },
      `Tu código de seguimiento es ${codigo}`
    );

    await this.sendEmail(email, '✅ Recibimos tu Reclamo - Reclamarte', html);
  }

  // =================================================================
  // 2. MAIL AL ADMIN (Nuevo Lead)
  // =================================================================
  async sendNewReclamoAdmin(datos: any) {
    const contenido = `
      <p>Se ha registrado un nuevo ingreso en la plataforma.</p>
      
      <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; font-size: 14px; margin: 20px 0;">
        <tr>
          <td width="30%" style="font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Cliente:</td>
          <td style="border-bottom: 1px solid #eee;">${datos.nombre}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #555; border-bottom: 1px solid #eee;">DNI:</td>
          <td style="border-bottom: 1px solid #eee;">${datos.dni}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Trámite:</td>
          <td style="border-bottom: 1px solid #eee;">${datos.tipo_tramite}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #555;">Código:</td>
          <td style="font-weight: bold; color: ${this.colors.primary}; font-family: monospace;">${datos.codigo_seguimiento}</td>
        </tr>
      </table>

      <p>Los archivos adjuntos ya están disponibles para su revisión.</p>
    `;

    const html = this.getHtmlTemplate(
      '🔔 Nuevo Caso Ingresado', 
      contenido, 
      { texto: 'Ir al Panel de Administración', link: 'https://reclamarte.ar/login' },
      `Nuevo reclamo de ${datos.nombre}`
    );

    await this.sendEmail('mfbcaneda@gmail.com', `🔥 Nuevo: ${datos.nombre}`, html);
  }

  // =================================================================
  // 3. MAIL DE CAMBIO DE ESTADO (Update)
  // =================================================================
  async sendStatusUpdate(email: string, nombre: string, nuevoEstado: string) {
    
    let colorBadge = this.colors.primary;
    let icono = '📋';
    
    if (nuevoEstado === 'En Proceso') { 
      colorBadge = this.colors.warning; 
      icono = '⚙️';
    }
    if (nuevoEstado === 'Finalizado') { 
      colorBadge = this.colors.success; 
      icono = '✅';
    }

    const contenido = `
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Te informamos que ha habido un movimiento en tu expediente.</p>
      
      <div style="text-align: center; margin: 35px 0;">
        <p style="margin-bottom: 8px; font-size: 12px; color: #999; text-transform: uppercase; font-weight: 600;">ESTADO ACTUAL:</p>
        <span style="
          display: inline-block; 
          padding: 12px 25px; 
          background-color: ${colorBadge}; 
          color: white; 
          border-radius: 50px; 
          font-weight: 700; 
          font-size: 18px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        ">
          ${icono} ${nuevoEstado.toUpperCase()}
        </span>
      </div>

      <p>Si necesitas más detalles, puedes ingresar a la plataforma con tu código.</p>
    `;

    const html = this.getHtmlTemplate(
      '📢 Novedades en tu Trámite', 
      contenido, 
      { texto: 'Ver Expediente', link: 'https://reclamarte.ar/consultar-tramite' },
      `Tu trámite pasó a estado: ${nuevoEstado}`
    );

    await this.sendEmail(email, `Novedades: Tu trámite está ${nuevoEstado}`, html);
  }

  // --- Helper Genérico de Envío ---
  private async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.resend.emails.send({
        from: 'no-reply@reclamarte.ar', 
        to: to,
        subject: subject,
        html: html,
      });
    } catch (error) {
      console.error('❌ Error enviando mail:', error);
    }
  }
}