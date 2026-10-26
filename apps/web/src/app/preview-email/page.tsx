import { render } from '@react-email/render'
import ParentClubEmail from '@/emails/ParentClubEmail'

export default async function PreviewEmailPage() {
  // Datos de prueba para el preview
  const fullName = 'Jessica De Sousa'
  const email = 'psicoaprendizajess@gmail.com'
  const cancelUrl = 'http://localhost:3000/cancelar/6ade7fab97b4bffa4ce3c097'
  const calendarUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Primera+sesion+gratuita&dates=20261031T140000Z/20261031T160000Z&details=Te+esperamos&location=Av.+El+Paseo'
  
  // Generamos un QR de prueba usando una API externa
  const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('http://localhost:3000/verificar/6ade7fab97b4bffa4ce3c097')}`

  const emailHtml = await render(
    ParentClubEmail({
      fullName,
      email,
      cancelUrl,
      calendarUrl,
      qrCodeDataUrl,
    })
  )

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
          <p className="font-bold">👁️ Vista previa del correo</p>
          <p className="mt-1">Así se verá el correo que recibirán los padres al registrarse. El QR es de prueba.</p>
        </div>
        <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
      </div>
    </div>
  )
}
