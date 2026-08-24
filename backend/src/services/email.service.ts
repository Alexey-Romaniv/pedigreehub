import nodemailer, { Transporter } from 'nodemailer'
import { env } from '../config/env'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Сервис email (nodemailer).
 * Если SMTP не настроен (dev), письма логируются в консоль —
 * ссылку верификации/сброса можно скопировать из логов бэкенда.
 */
class EmailService {
  private transporter: Transporter | null = null

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT || 587),
        secure: Number(env.SMTP_PORT) === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      })
    }
  }

  get isConfigured(): boolean {
    return this.transporter !== null
  }

  /**
   * Проверка соединения с SMTP-сервером (логин/пароль, хост, порт).
   * Используется скриптом `yarn test-email` перед реальной отправкой.
   */
  async verifyConnection(): Promise<{ ok: boolean; error?: string }> {
    if (!this.transporter) {
      return { ok: false, error: 'SMTP nie jest skonfigurowany (brak SMTP_HOST/USER/PASS)' }
    }

    try {
      await this.transporter.verify()
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Тестовое письмо — проверка сквозной доставки (`yarn test-email <adres>`).
   * В отличие от остальных методов бросает ошибку, чтобы скрипт увидел причину.
   */
  async sendTestEmail(to: string): Promise<void> {
    await this.send({
      to,
      subject: 'PedigreeHub — test konfiguracji SMTP',
      html: this.wrapLayout(
        'Test konfiguracji SMTP',
        `
        <p>Jeśli widzisz tę wiadomość, wysyłka email z PedigreeHub działa poprawnie.</p>
        <p style="font-size: 13px; color: #595959;">Adres frontendu w linkach: ${env.FRONTEND_URL}</p>
        `
      ),
    })
  }

  private async send(options: SendEmailOptions): Promise<void> {
    if (!this.transporter) {
      // Dev-fallback: логируем письмо вместо отправки
      console.log('----------------------------------------')
      console.log(`[email dev-mode] To: ${options.to}`)
      console.log(`Subject: ${options.subject}`)
      const links = options.html.match(/https?:\/\/[^"'\s<]+/g)
      if (links) {
        links.forEach((link) => console.log(`Link: ${link}`))
      }
      console.log('----------------------------------------')
      return
    }

    await this.transporter.sendMail({
      from: env.EMAIL_FROM || 'noreply@pedigreehub.pl',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
  }

  /**
   * Безопасная отправка: ошибка SMTP не должна блокировать регистрацию/сброс —
   * логируем и идём дальше.
   */
  private async sendSafe(options: SendEmailOptions): Promise<void> {
    try {
      await this.send(options)
    } catch (error) {
      console.error(`Błąd wysyłki email do ${options.to}:`, error)
    }
  }

  private wrapLayout(title: string, bodyHtml: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
        <h2 style="margin: 0 0 8px;">PedigreeHub</h2>
        <h3 style="margin: 0 0 16px; font-weight: normal;">${title}</h3>
        ${bodyHtml}
        <p style="margin-top: 32px; font-size: 12px; color: #8c8c8c;">
          Jeśli nie spodziewałeś się tej wiadomości, zignoruj ją.
        </p>
      </div>
    `
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/verify-email?token=${token}`
    await this.sendSafe({
      to,
      subject: 'PedigreeHub — potwierdź swój adres email',
      html: this.wrapLayout(
        'Potwierdź swój adres email',
        `
        <p>Dziękujemy za rejestrację w PedigreeHub!</p>
        <p>Kliknij poniższy przycisk, aby potwierdzić swój adres email:</p>
        <p style="margin: 24px 0;">
          <a href="${url}" style="background: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Potwierdź email
          </a>
        </p>
        <p style="font-size: 13px; color: #595959;">Lub skopiuj link do przeglądarki:<br/>${url}</p>
        <p style="font-size: 13px; color: #595959;">Link jest ważny przez 24 godziny.</p>
        `
      ),
    })
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/reset-password?token=${token}`
    await this.sendSafe({
      to,
      subject: 'PedigreeHub — resetowanie hasła',
      html: this.wrapLayout(
        'Resetowanie hasła',
        `
        <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.</p>
        <p style="margin: 24px 0;">
          <a href="${url}" style="background: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Ustaw nowe hasło
          </a>
        </p>
        <p style="font-size: 13px; color: #595959;">Lub skopiuj link do przeglądarki:<br/>${url}</p>
        <p style="font-size: 13px; color: #595959;">Link jest ważny przez 1 godzinę. Jeśli to nie Ty — zignoruj tę wiadomość, hasło pozostanie bez zmian.</p>
        `
      ),
    })
  }
}

export const emailService = new EmailService()
