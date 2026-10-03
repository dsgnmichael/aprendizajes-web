import Image from 'next/image'
import Link from 'next/link'
import { Plus, ChevronRight } from 'lucide-react'

const STAR = String.fromCharCode(9733)

// Textos con acentos protegidos con unicode escapes
const TXT_MAS_ANOS = 'M\u00C1S DE 14 A\u00D1OS'
const TXT_NINOS = 'Ni\u00F1os'
const TXT_SINONIMO = 'Descubriendo que aprender no tiene por que ser sinonimo de tristeza, sino de juego y descubrimiento.'

const socialIcons = (size: number = 16) => (
  <>
    <a href="#" className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-[#4d2a80] hover:text-[#3a1d66] transition-colors" aria-label="WhatsApp">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
    <a href="#" className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-[#4d2a80] hover:text-[#3a1d66] transition-colors" aria-label="Instagram">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    </a>
    <a href="#" className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-[#4d2a80] hover:text-[#3a1d66] transition-colors" aria-label="TikTok">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    </a>
    <a href="#" className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-[#4d2a80] hover:text-[#3a1d66] transition-colors" aria-label="Correo">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    </a>
  </>
)

const attributeIconsDesktop = () => (
  <>
    <div className="flex flex-col items-center text-center text-white gap-1.5">
      <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-full border-2 border-white/70 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        </svg>
      </div>
      <p className="text-[10px] lg:text-xs leading-tight font-bold">{TXT_NINOS} y<br />Adolescentes</p>
    </div>
    <div className="flex flex-col items-center text-center text-white gap-1.5">
      <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-full border-2 border-white/70 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v6M12 22v-6M4.93 10.93l4.24 4.24M14.83 4.83l4.24 4.24M2 12h6M22 12h-6M4.93 13.07l4.24-4.24M14.83 19.17l4.24-4.24" />
        </svg>
      </div>
      <p className="text-[10px] lg:text-xs leading-tight font-bold">Dificultad del<br />Aprendizaje</p>
    </div>
    <div className="flex flex-col items-center text-center text-white gap-1.5">
      <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-full border-2 border-white/70 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M8 2v4M16 2v4M2 10h20" />
        </svg>
      </div>
      <p className="text-[10px] lg:text-xs leading-tight font-bold">Presencial y<br />Online</p>
    </div>
  </>
)

const attributeIconsMobile = () => (
  <>
    <div className="flex flex-col items-center text-center text-white gap-1">
      <div className="w-7 h-7 rounded-full border-2 border-white/70 flex items-center justify-center shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        </svg>
      </div>
      <p className="text-[9px] leading-tight font-bold">{TXT_NINOS}</p>
    </div>
    <div className="flex flex-col items-center text-center text-white gap-1">
      <div className="w-7 h-7 rounded-full border-2 border-white/70 flex items-center justify-center shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v6M12 22v-6M4.93 10.93l4.24 4.24M14.83 4.83l4.24 4.24M2 12h6M22 12h-6M4.93 13.07l4.24-4.24M14.83 19.17l4.24-4.24" />
        </svg>
      </div>
      <p className="text-[9px] leading-tight font-bold">Aprendizaje</p>
    </div>
    <div className="flex flex-col items-center text-center text-white gap-1">
      <div className="w-7 h-7 rounded-full border-2 border-white/70 flex items-center justify-center shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M8 2v4M16 2v4M2 10h20" />
        </svg>
      </div>
      <p className="text-[9px] leading-tight font-bold">Online</p>
    </div>
  </>
)

const testimonialCard = () => (
  <div className="relative">
    <div className="bg-cream rounded-2xl p-4 md:p-5 shadow-lg">
      <p className="text-purple-dark font-black text-xs md:text-sm mb-2">NATHALY GRUBER</p>
      <p className="text-ink text-[11px] md:text-xs leading-relaxed italic">
        Lo mejor que le puede haber pasado a mis hijos es su experiencia Aprendizajess 100% recomendado.
      </p>
      <div className="flex gap-1 mt-3 text-yellow-500 text-xl md:text-2xl">
        <span>{STAR}</span><span>{STAR}</span><span>{STAR}</span><span>{STAR}</span><span>{STAR}</span>
      </div>
    </div>
    <button className="absolute right-[-10px] md:right-[-14px] top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full bg-purple-dark text-white flex items-center justify-center hover:bg-ink transition-colors" aria-label="Siguiente">
      <ChevronRight size={16} />
    </button>
  </div>
)

const addTestimonialLink = () => (
  <div className="mt-4 w-full flex justify-center">
    <a
      href="https://maps.app.goo.gl/U6Jj8aPCMypiP9TLA"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-white font-bold text-xs md:text-sm tracking-wider uppercase no-underline hover:text-white/70 transition-colors"
    >
      <Plus size={16} strokeWidth={3} />
      Agregar testimonio
    </a>
  </div>
)

export default function Hero() {
  return (
    <section className="relative bg-cream overflow-hidden pb-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6 md:pt-10">

        {/* DESKTOP / TABLET: desde md (768px+) */}
        <div className="hidden md:block">

          <div className="grid grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
            <div className="text-left">
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-black italic text-ink leading-none tracking-tight">JESSICA DE SOUSA</h1>
              <p className="font-script text-3xl lg:text-4xl xl:text-5xl text-purple-dark leading-none mt-1 lg:mt-2">psicopedagoga</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg lg:text-2xl xl:text-3xl font-black italic text-ink leading-none tracking-tight">{TXT_MAS_ANOS}</h2>
              <p className="font-script text-3xl lg:text-4xl xl:text-5xl text-purple-dark leading-none mt-1 lg:mt-2">De Experiencia</p>
            </div>
          </div>

          <div className="relative">
            <div className="relative bg-[#8777b5] rounded-[2rem] lg:rounded-[2.5rem]">

              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[450px] lg:h-[520px] xl:h-[600px] flex items-end justify-center pointer-events-none z-10">
                <Image
                  src="/img/img_JessicaDeSousa.png"
                  alt="Jessica De Sousa"
                  width={600}
                  height={720}
                  className="h-full w-auto object-contain object-bottom drop-shadow-xl"
                  priority
                />
              </div>

              <div className="grid grid-cols-3 relative z-20">
                <div className="p-5 lg:p-8 xl:p-10 space-y-3 lg:space-y-5 flex flex-col justify-center">
                  <h3 className="text-[22px] lg:text-[32px] xl:text-[43px] font-black italic text-white leading-[1.05]">
                    Aprender puede<br />ser divertido.
                  </h3>
                  <p className="text-white/90 text-xs lg:text-sm xl:text-base leading-relaxed">
                    {TXT_SINONIMO}
                  </p>
                  <Link href="#agendar" className="inline-flex items-center gap-2 bg-[#4d2a80] text-cream rounded-full px-4 lg:px-5 xl:px-6 py-2 lg:py-2.5 xl:py-3 font-bold text-[11px] lg:text-xs xl:text-sm hover:bg-purple-dark transition-colors self-start">
                    <Plus size={14} strokeWidth={3} />
                    AGENDAR CITA
                  </Link>
                  <div className="inline-flex items-center gap-1 lg:gap-2 bg-[#cfc4e0] rounded-full p-1.5 lg:p-2 self-start">
                    {socialIcons(25)}
                  </div>
                </div>

                <div className="col-span-1"></div>

                <div className="p-5 lg:p-8 xl:p-10 space-y-4 lg:space-y-5 flex flex-col justify-center">
                  <div className="flex items-start justify-around gap-1 lg:gap-2">
                    {attributeIconsDesktop()}
                  </div>
                  <div>
                    <p className="text-center text-white/80 text-[10px] lg:text-xs font-bold tracking-widest mb-2 lg:mb-3">TESTIMONIOS</p>
                    {testimonialCard()}
                    {addTestimonialLink()}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* MOBILE: menos de md (<768px) */}
        <div className="md:hidden">

          <div className="flex justify-center mb-4 relative z-20">
            <div className="inline-flex items-center gap-1.5 bg-[#cfc4e0] rounded-full p-1.5">
              {socialIcons(28)}
            </div>
          </div>

          <div className="text-left mb-4 relative z-20 pl-[5%]">
            <h1 className="text-2xl font-black italic text-ink leading-none tracking-tight">JESSICA DE SOUSA</h1>
            <p className="font-script text-4xl text-purple-dark leading-none mt-1">psicopedagoga</p>
          </div>

          <div className="relative">
            <div className="relative bg-[#8777b5] rounded-[2rem] pt-6 pb-6">

              <div className="absolute -top-[18%] right-[2%] bottom-[28%] flex items-end justify-center pointer-events-none z-10">
                <Image
                  src="/img/img_JessicaDeSousa.png"
                  alt="Jessica De Sousa"
                  width={600}
                  height={720}
                  className="h-full w-auto object-contain object-bottom drop-shadow-xl"
                  priority
                />
              </div>

              <div className="relative z-20 px-5">

                <div className="flex gap-4">
                  <div className="flex-1 space-y-3">
                    <h3 className="text-[18px] font-black italic text-white leading-tight">
                      Aprender puede<br />ser divertido.
                    </h3>
                    <p className="text-white/90 text-xs leading-relaxed max-w-[58%]">
                      {TXT_SINONIMO}
                    </p>

                    <div className="flex items-start justify-start gap-2 py-2 max-w-[52%]">
                      {attributeIconsMobile()}
                    </div>

                    <Link href="#agendar" className="inline-flex items-center gap-2 bg-[#4d2a80] text-cream rounded-full px-4 py-2 font-bold text-[11px] hover:bg-purple-dark transition-colors self-start">
                      <Plus size={14} strokeWidth={3} />
                      AGENDAR CITA
                    </Link>
                  </div>

                  <div className="w-[42%] shrink-0"></div>
                </div>

                <div className="mt-5">
                  {testimonialCard()}
                  {addTestimonialLink()}
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}