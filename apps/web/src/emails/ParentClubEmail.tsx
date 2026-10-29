import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface ParentClubEmailProps {
  fullName: string
  email: string
  qrCodeDataUrl: string
}

export const ParentClubEmail = ({
  fullName = 'Jessica',
  email = 'psicoaprendizajess@gmail.com',
  qrCodeDataUrl = '',
}: ParentClubEmailProps) => {
  const firstName = fullName.split(' ')[0]

  return (
    <Html>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;0,900;1,400;1,900&display=swap" rel="stylesheet" />
      </Head>
      <Preview>Hemos recibido tu postulación para el Club de Padres.</Preview>
      <Body style={main}>
        <Container style={container}>
          
          <Section style={logoSection}>
            <Img
              src="https://aprendizajess.vercel.app/brand/logo.png"
              alt="Aprendizajes Logo"
              width="120"
              style={{ margin: '0 auto', display: 'block' }}
            />
          </Section>

          <Section style={heroSection}>
            <Heading style={heroTitle}>
              ¡Hola, {firstName}!
            </Heading>
            <Text style={heroSubtitle}>
              Gracias por postularte a nuestra primera actividad. Hemos recibido tu información correctamente.
            </Text>
            <Text style={heroSubtitle}>
              Nuestro equipo está revisando las solicitudes para la sesión gratuita. Nos pondremos en contacto contigo muy pronto para confirmar si has sido seleccionado/a.
            </Text>
            <Text style={heroSubtitle}>
              Si en esta oportunidad no eres seleccionado/a, no te preocupes. Estamos preparando muchas más actividades y serás de los primeros en enterarte.
            </Text>
          </Section>

          <Section style={cardWrapper}>
            <Section style={cardSection}>
              <Text style={cardKicker}>Detalles del Evento</Text>
              <Text style={{ textAlign: 'center', color: '#4d2a80', fontWeight: 'bold', margin: '0 0 8px 0' }}>Sábado 31 de Octubre</Text>
              <Text style={{ textAlign: 'center', color: '#1a1a1a', margin: '0 0 8px 0' }}>10:00 AM - 12:00 PM</Text>
              <Text style={{ textAlign: 'center', color: '#5a5566', fontSize: '14px', margin: '0' }}>Av. El Paseo, Los Rosales, Caracas</Text>
            </Section>
          </Section>

          <Section style={credentialWrapper}>
            <Section style={credentialSection}>
              <Text style={credentialKicker}>Tu Comprobante de Postulación</Text>
              <Text style={emailText}>{email}</Text>
              {qrCodeDataUrl ? (
                <Img src={qrCodeDataUrl} width="140" height="140" alt="Código QR" style={{ margin: '0 auto', display: 'block', borderRadius: '16px', border: '4px solid #ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              ) : null}
              <Text style={noteText}>Guarda este correo. Si eres seleccionado, te pediremos este código en la entrada.</Text>
            </Section>
          </Section>

          <Section style={buttonSection}>
            <div style={buttonWrapper}>
              <Button style={buttonPrimary} href="https://wa.me/584241214452">
                Escríbenos por WhatsApp
              </Button>
            </div>
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>
              ¿Tienes dudas? Escríbenos al <strong>+58 424 121 4452</strong>.
            </Text>
            <Text style={footerScript}>
              ¡Esto apenas comienza!
            </Text>
            <Text style={footerBrand}>
              Equipo de Aprendizajess
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ParentClubEmail

const main = { backgroundColor: '#f5f4f0', fontFamily: "'Lato', system-ui, sans-serif", padding: '40px 0' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', maxWidth: '600px', borderRadius: '48px', overflow: 'hidden', boxShadow: '0 24px 48px -20px rgba(30, 16, 60, 0.15)' }
const logoSection = { padding: '48px 0 40px 0', textAlign: 'center' as const, backgroundColor: '#ffffff' }
const heroSection = { backgroundColor: '#ffffff', padding: '0 32px 40px', textAlign: 'center' as const }
const heroTitle = { color: '#1a1a1a', fontSize: '36px', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' as const, margin: '0', lineHeight: '0.95', letterSpacing: '-0.02em' }
const heroSubtitle = { color: '#5a5566', fontSize: '16px', lineHeight: '1.6', margin: '16px 0 0', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }
const cardWrapper = { padding: '0 32px' }
const cardSection = { backgroundColor: '#f5f4f0', borderRadius: '28px', padding: '32px' }
const cardKicker = { color: '#4d2a80', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' as const, letterSpacing: '0.15em', margin: '0 0 16px 0', textAlign: 'center' as const }
const credentialWrapper = { padding: '32px 32px 0' }
const credentialSection = { backgroundColor: '#ffffff', border: '2px dashed #ece7f3', borderRadius: '28px', padding: '32px', textAlign: 'center' as const }
const credentialKicker = { color: '#e8323c', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' as const, letterSpacing: '0.15em', margin: '0 0 16px 0' }
const emailText = { color: '#1a1a1a', fontSize: '16px', fontWeight: '700', margin: '0 0 24px 0' }
const noteText = { color: '#5a5566', fontSize: '12px', margin: '24px 0 0 0' }
const buttonSection = { padding: '40px 32px 0', textAlign: 'center' as const }
const buttonWrapper = { textAlign: 'center' as const, margin: '0 0 16px 0' }
const buttonPrimary = { backgroundColor: '#4d2a80', borderRadius: '999px', color: '#ffffff', fontSize: '15px', fontWeight: '900', textTransform: 'uppercase' as const, letterSpacing: '0.05em', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '16px 32px', boxShadow: '0 8px 24px -12px rgba(30, 16, 60, 0.18)' }
const footerSection = { padding: '40px 32px 48px', textAlign: 'center' as const }
const footerText = { color: '#1a1a1a', fontSize: '14px', lineHeight: '1.5', margin: '0 0 24px 0' }
const footerScript = { color: '#4d2a80', fontSize: '24px', fontFamily: 'Georgia, serif', fontStyle: 'italic', margin: '0 0 8px 0' }
const footerBrand = { color: '#1a1a1a', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 16px 0' }
