import { google } from 'googleapis'
import QRCode from 'qrcode'
import { render } from '@react-email/render'
import { ParentClubEmail } from '../emails/ParentClubEmail'

// Usando TUS variables exactas de tu .env
const oAuth2Client = new google.auth.OAuth2({
  clientId: process.env.GMAIL_CLIENT_ID,
  clientSecret: process.env.GMAIL_CLIENT_SECRET,
  redirectUri: 'https://developers.google.com/oauthplayground'
})

oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
})

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })

export async function sendParentClubEmail({
  registrationId,
  fullName,
  email,
  eventDate = 'Sábado 31 de Octubre',
  eventTime = '10:00 AM - 12:00 PM',
  eventLocation = 'Av. El Paseo, Los Rosales, Caracas'
}: {
  registrationId: string
  fullName: string
  email: string
  eventDate?: string
  eventTime?: string
  eventLocation?: string
}) {
  try {
    // 1. Generar el QR en Base64
    const qrCodeWrl = await QRCode.toDataURL(registrationId, {
      width: 300,
      margin: 2,
      color: { dark: '#4d2a80', light: '#ffffff' }
    })

    // 2. Generar las URLs de acción
    const baseUrl = process.env.PUBLIC_BASE_URL || 'https://aprendizajess.vercel.app'
    const cancelUrl = `${baseUrl}/verificar/${registrationId}`
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Club+de+Padres+Aprendizajess&dates=20261031T100000/20261031T120000&details=Tu+registro+en+el+Club+de+Padres&location=${encodeURIComponent(eventLocation)}`

    // 3. Renderizar el componente de React a HTML
    const emailHtml = await render(
      ParentClubEmail({
        fullName,
        email,
        cancelUrl,
        calendarUrl,
        qrCodeDataUrl: qrCodeWrl,
      })
    )

    // 4. Construir el mensaje MIME
    const subject = 'Hemos recibido tu postulación - Club de Padres Aprendizajess'
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`
    const messageParts = [
      `From: Aprendizajess <${process.env.GMAIL_FROM_EMAIL}>`,
      `To: ${fullName} <${email}>`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      emailHtml,
    ]
    const message = messageParts.join('\n')
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // 5. Enviar el correo a través de Gmail API
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    })

    console.log(`✅ Correo enviado exitosamente a ${email}`)
    return { ok: true }
  } catch (error) {
    console.error('❌ Error al enviar el correo:', error)
    return { ok: false, error }
  }
}
