import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components'
import * as React from 'react'

interface ParentClubEmailProps {
  fullName: string
  email: string
  cancelUrl: string
  calendarUrl: string
  qrCodeDataUrl: string
}

export const ParentClubEmail = ({
  fullName = 'Jessica',
  email = 'psicoaprendizajess@gmail.com',
  cancelUrl = '#',
  calendarUrl = '#',
  qrCodeDataUrl = '',
}: ParentClubEmailProps) => {
  const firstName = fullName.split(' ')[0]

  return (
    <Html>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;0,900;1,400;1,900&display=swap" rel="stylesheet" />
      </Head>
      <Preview>¡Tu lugar en el Club de Padres está confirmado!</Preview>
      <Body style={main}>
        <Container style={container}>
          
          {/* AREA 1: LOGO */}
          <Section style={logoSection}>
            <Img
              src="https://aprendizajess.vercel.app/brand/logo.png"
              alt="Aprendizajes Logo"
              width="120"
              style={{ margin: '0 auto', display: 'block' }}
            />
          </Section>

          {/* AREA 2: HERO (Texto) */}
          <Section style={heroSection}>
            <Heading style={heroTitle}>
              ¡Hola, {firstName}!
            </Heading>
            <Text style={heroSubtitle}>
              Gracias por unirte a nuestra primera actividad. Tu registro para la sesión gratuita está confirmado.
            </Text>
          </Section>

          {/* AREA 3: DETALLES */}
          <Section style={cardWrapper}>
            <Section style={cardSection}>
              <Text style={cardKicker}>Detalles del Evento</Text>
              <Row>
                <Column style={columnStyle}>
                  <div style={{ backgroundColor: '#ece7f3', borderRadius: '50%', width: '48px', height: '48px', lineHeight: '48px', textAlign: 'center', margin: '0 auto 12px', fontSize: '24px' }}>📅</div>
                  <Text style={columnTitle}>Fecha</Text>
                  <Text style={columnText}>Sábado<br />31 Octubre</Text>
                </Column>
                <Column style={columnStyle}>
                  <div style={{ backgroundColor: '#ece7f3', borderRadius: '50%', width: '48px', height: '48px', lineHeight: '48px', textAlign: 'center', margin: '0 auto 12px', fontSize: '24px' }}>🕒</div>
                  <Text style={columnTitle}>Hora</Text>
                  <Text style={columnText}>10:00 AM<br />12:00 PM</Text>
                </Column>
                <Column style={columnStyle}>
                  <div style={{ backgroundColor: '#ece7f3', borderRadius: '50%', width: '48px', height: '48px', lineHeight: '48px', textAlign: 'center', margin: '0 auto 12px', fontSize: '24px' }}>📍</div>
                  <Text style={columnTitle}>Lugar</Text>
                  <Text style={columnText}>Av. El Paseo<br />Los Rosales</Text>
                </Column>
              </Row>
              <Text style={{ textAlign: 'center', marginTop: '24px' }}>
                <Link href="https://maps.app.goo.gl/vm21V6L3KEkgjJ9Q7" style={{ color: '#4d2a80', textDecoration: 'underline', fontWeight: '700', fontSize: '14px' }}>Ver ubicación en Google Maps</Link>
              </Text>
            </Section>
          </Section>

          {/* AREA 4: CREDENCIAL */}
          <Section style={credentialWrapper}>
            <Section style={credentialSection}>
              <Text style={credentialKicker}>Tu Credencial</Text>
              <Text style={emailText}>{email}</Text>
              {qrCodeDataUrl ? (
                <Img src={qrCodeDataUrl} width="140" height="140" alt="Código QR" style={{ margin: '0 auto', display: 'block', borderRadius: '16px', border: '4px solid #ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              ) : null}
              <Text style={noteText}>Mostrala en la entrada del evento</Text>
            </Section>
          </Section>

          {/* AREA 5: BOTONES */}
          <Section style={buttonSection}>
            <div style={buttonWrapper}>
              <Button style={buttonPrimary} href={calendarUrl}>
                Añadir a mi calendario
              </Button>
            </div>
            <div style={buttonWrapper}>
              <Button style={buttonDanger} href={cancelUrl}>
                No podré asistir
              </Button>
            </div>
            <Text style={cancelWarning}>
              * Solo haz clic si estás seguro. Liberarás tu cupo para otra persona.
            </Text>
          </Section>

          {/* AREA 6: FOOTER */}
          <Hr style={hrStyle} />
          <Section style={footerSection}>
            <Text style={footerText}>
              Cualquier duda, escríbenos por WhatsApp al <strong>+58 424 121 4452</strong>.
            </Text>
            <Text style={footerScript}>
              ¡Nos vemos pronto!
            </Text>
            <Text style={footerBrand}>
              Equipo de Aprendizajess
            </Text>
            <Text style={footerMuted}>
              Av. El Paseo, Los Rosales, Caracas<br />
              aprendizajess.vercel.app
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ParentClubEmail

/* ESTILOS */

const main = {
  backgroundColor: '#f5f4f0',
  fontFamily: "'Lato', system-ui, sans-serif",
  padding: '40px 0',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '48px',
  overflow: 'hidden',
  boxShadow: '0 24px 48px -20px rgba(30, 16, 60, 0.15)',
}

const logoSection = {
  padding: '48px 0 60px 0',
  textAlign: 'center' as const,
  backgroundColor: '#ffffff',
}

const heroSection = {
  backgroundColor: '#ffffff', 
  padding: '0 32px 48px',
  textAlign: 'center' as const,
}

const heroTitle = {
  color: '#1a1a1a',
  fontSize: '42px',
  fontWeight: '900',
  fontStyle: 'italic',
  textTransform: 'uppercase' as const,
  margin: '0',
  lineHeight: '0.95',
  letterSpacing: '-0.02em',
}

const heroSubtitle = {
  color: '#5a5566',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0',
  maxWidth: '480px',
  marginLeft: 'auto',
  marginRight: 'auto',
}

const cardWrapper = {
  padding: '0 32px',
}

const cardSection = {
  backgroundColor: '#f5f4f0',
  borderRadius: '28px',
  padding: '40px 32px',
}

const cardKicker = {
  color: '#4d2a80',
  fontSize: '12px',
  fontWeight: '900',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.15em',
  margin: '0 0 32px 0',
  textAlign: 'center' as const,
}

const columnStyle = {
  textAlign: 'center' as const,
  padding: '0 8px',
}

const columnTitle = {
  color: '#4d2a80',
  fontSize: '14px',
  fontWeight: '900',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px 0',
}

const columnText = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '400',
  lineHeight: '1.4',
  margin: '0',
}

const credentialWrapper = {
  padding: '32px 32px 0',
}

const credentialSection = {
  backgroundColor: '#ffffff',
  border: '2px dashed #ece7f3',
  borderRadius: '28px',
  padding: '40px 32px',
  textAlign: 'center' as const,
}

const credentialKicker = {
  color: '#e8323c',
  fontSize: '12px',
  fontWeight: '900',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.15em',
  margin: '0 0 16px 0',
}

const emailText = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 32px 0',
}

const noteText = {
  color: '#5a5566',
  fontSize: '12px',
  margin: '24px 0 0 0',
}

const buttonSection = {
  padding: '48px 32px 0',
  textAlign: 'center' as const,
}

const buttonWrapper = {
  textAlign: 'center' as const,
  margin: '0 0 16px 0',
}

const buttonPrimary = {
  backgroundColor: '#4d2a80',
  borderRadius: '999px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '900',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  boxShadow: '0 8px 24px -12px rgba(30, 16, 60, 0.18)',
}

const buttonDanger = {
  backgroundColor: '#e8323c',
  borderRadius: '999px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '900',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  boxShadow: '0 8px 24px -12px rgba(232, 50, 60, 0.3)',
}

const cancelWarning = {
  color: '#5a5566',
  fontSize: '11px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
  margin: '8px 0 0 0',
  padding: '0 20px',
}

const hrStyle = {
  borderColor: '#e4e0ea',
  margin: '60px 32px 0',
}

const footerSection = {
  padding: '40px 32px 48px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#1a1a1a',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 24px 0',
}

const footerScript = {
  color: '#4d2a80',
  fontSize: '24px',
  fontFamily: 'Georgia, serif',
  fontStyle: 'italic',
  margin: '0 0 8px 0',
}

const footerBrand = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '900',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 16px 0',
}

const footerMuted = {
  color: '#5a5566',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0',
}
