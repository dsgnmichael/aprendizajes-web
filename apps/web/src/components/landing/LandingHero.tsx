import Image from 'next/image'
import type { ComponentType } from 'react'
import { digitsOnly, whatsappUrl } from '@repo/domain'
import { Mail } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from '@/components/ui/BrandIcons'
import { TrackedLink } from '@/components/ui/TrackedLink'
import type { LandingSectionProps } from './types'

export function LandingHero({ section, ctx }: LandingSectionProps<'landingHero'>) {
  const c = section.content
  const eager = ctx.index === 0
  const imageSrc = '/img/jessica_mueble.png'
  const highlights = c.highlights.slice(0, 4)

  const site = ctx.site
  const org = site?.organization
  const social = site?.social
  const orgName = site?.organizationName ?? 'Aprendizajess'

  const contactItems: { key: string, label: string, href: string, Icon: ComponentType<{ size?: number }>, external: boolean }[] = []
  if (org?.whatsapp && digitsOnly(org.whatsapp).length >= 8) {
    contactItems.push({ key: 'whatsapp', label: 'WhatsApp', href: whatsappUrl(org.whatsapp, `Hola ${orgName}, `), Icon: WhatsAppIcon, external: true })
  }
  if (social?.instagram) {
    contactItems.push({ key: 'instagram', label: 'Instagram', href: social.instagram, Icon: InstagramIcon, external: true })
  }
  if (social?.tiktok) {
    contactItems.push({ key: 'tiktok', label: 'TikTok', href: social.tiktok, Icon: TikTokIcon, external: true })
  }
  if (org?.email) {
    contactItems.push({ key: 'email', label: 'Email', href: `mailto:${org.email}`, Icon: Mail, external: false })
  }

  return (
    <section
      id="inicio"
      aria-labelledby="landing-title"
      data-section="landingHero"
      className={cn(
        'relative overflow-hidden bg-gradient-to-b from-[#4d2a80] to-[#8777b5] text-white',
        section.responsive.hideOnMobile && 'max-md:hidden',
        section.responsive.hideOnDesktop && 'md:hidden',
      )}
    >
      {/* En desktop usamos grid de 2 columnas, en móvil flex-col */}
      <div className="relative mx-auto flex w-full max-w-wide flex-col px-5 pt-8 pb-0 sm:px-8 lg:grid lg:grid-cols-2 lg:items-center lg:gap-8 lg:px-10 lg:py-16">
        
        {/* COLUMNA IZQUIERDA (Desktop): Textos, Botones y Redes */}
        <div className="relative z-20 flex w-full flex-col items-center text-center lg:items-start lg:text-left">
          {c.eyebrow ? (
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[0.65rem] font-bold tracking-[0.14em] text-[#4d2a80] uppercase shadow-sm">
              <span className="size-2 rounded-full bg-[#b7ace5]" />
              {c.eyebrow}
            </p>
          ) : null}
          
          <h1
            id="landing-title"
            className="mt-5 text-[clamp(2rem,7vw,4.5rem)] leading-[0.95] font-black tracking-[-0.02em] text-balance text-white uppercase italic"
          >
            {c.title}
          </h1>
          
          {c.titleScript ? (
            <p className="script mt-1 text-[clamp(1.8rem,6vw,3.5rem)] leading-tight text-[#b7ace5]">
              {c.titleScript}
            </p>
          ) : null}
          
          {c.subtitle ? (
            <p className="mt-5 w-full max-w-[480px] text-[0.85rem] leading-relaxed text-white/90 sm:text-base lg:max-w-xl lg:text-lg">
              {c.subtitle}{' '}
              <a href="#que-te-suena-familiar" className="font-bold underline underline-offset-4 transition-colors hover:text-white">Leer más</a>
            </p>
          ) : null}

          {/* Botones (Solo Desktop) */}
          <div className="mt-8 hidden flex-row flex-wrap gap-3 lg:flex">
            <a
              href="/equipo"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#b7ace5] px-6 py-3 text-[0.75rem] font-black tracking-wide text-[#4d2a80] uppercase shadow-xl transition-all duration-300 hover:scale-110 motion-safe:animate-[float_4s_ease-in-out_infinite] sm:text-sm"
            >
              Agendar Cita
            </a>
            <a
              href="/equipo"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-[0.75rem] font-black tracking-wide text-[#4d2a80] uppercase shadow-xl transition-all duration-300 hover:scale-110 motion-safe:animate-[float_4s_ease-in-out_infinite] sm:text-sm"
            >
              Conocer al Equipo
            </a>
          </div>

          {/* Redes Sociales (Solo Desktop) */}
          {contactItems.length > 0 && (
            <div className="mt-6 hidden flex-row items-center gap-2 lg:flex motion-safe:animate-[float_4s_ease-in-out_infinite]">
              {contactItems.map((item) => (
                <TrackedLink
                  key={item.key}
                  href={item.href}
                  event="social_click"
                  eventProps={{ network: item.key }}
                  external={item.external}
                  aria-label={item.label}
                  className="grid size-10 place-items-center rounded-full bg-white text-[#4d2a80] shadow-sm transition-transform hover:scale-110"
                >
                  <item.Icon size={22} />
                </TrackedLink>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA (Desktop): Imagen y Arco */}
        <div className="relative mt-8 w-full max-w-[550px] mx-auto flex justify-center lg:mt-0 lg:max-w-none lg:self-end lg:-mb-24">
          
          {/* Infografía */}
          <div className="absolute inset-x-0 top-2 z-10 mx-auto h-[240px] w-[90%] max-w-[440px] lg:max-w-[500px]" aria-hidden="true">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 240" preserveAspectRatio="none">
              <path d="M 20 200 A 180 180 0 0 1 380 200" stroke="white" strokeWidth="1.5" strokeDasharray="4 8" fill="none" opacity="0.4" />
            </svg>

            {highlights.map((h, i) => {
              const positions = [
                'left-[5%] top-[83.3%]',
                'left-[27.5%] top-[18.4%]',
                'left-[72.5%] top-[18.4%]',
                'left-[95%] top-[83.3%]',
              ]
              return (
                <div 
                  key={h.id} 
                  className={cn(
                    'absolute size-12 -translate-x-1/2 -translate-y-1/2', 
                    positions[i]
                  )}
                >
                  <div className="grid size-full place-items-center rounded-full bg-[#b7ace5] text-white shadow-lg">
                    <Icon name={h.icon} size={20} />
                  </div>
                  <span className="absolute left-1/2 top-14 w-[90px] -translate-x-1/2 text-center text-[0.65rem] font-bold leading-tight text-white lg:w-[110px] lg:text-[0.75rem]">
                    {h.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Imagen */}
          <div className="relative z-0 mt-24 w-full flex justify-center">
            <Image
              src={imageSrc}
              alt="Especialista en su consultorio"
              width={500}
              height={600}
              priority={eager}
              sizes="(min-width: 768px) 550px, 100vw"
              className="h-auto w-full max-w-[460px] object-contain drop-shadow-2xl lg:max-w-[680px] lg:origin-bottom"
            />
          </div>

          {/* Botones (Solo Mobile/Tablet) */}
          <div className="absolute bottom-[18%] left-[2%] z-30 flex flex-col items-start gap-3 lg:hidden">
            <a
              href="/equipo"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#b7ace5] px-6 py-3 text-[0.75rem] font-black tracking-wide text-[#4d2a80] uppercase shadow-xl transition-all duration-300 hover:scale-110 motion-safe:animate-[float_4s_ease-in-out_infinite] sm:text-sm"
            >
              Agendar Cita
            </a>
            <a
              href="/equipo"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-[0.75rem] font-black tracking-wide text-[#4d2a80] uppercase shadow-xl transition-all duration-300 hover:scale-110 motion-safe:animate-[float_4s_ease-in-out_infinite] sm:text-sm"
            >
              Conocer al Equipo
            </a>
          </div>

          {/* Redes Sociales (Solo Mobile/Tablet) */}
          {contactItems.length > 0 && (
            <div className="absolute bottom-[18%] right-[2%] z-30 flex flex-row items-center gap-1.5 sm:gap-2 lg:hidden motion-safe:animate-[float_4s_ease-in-out_infinite]">
              {contactItems.map((item) => (
                <TrackedLink
                  key={item.key}
                  href={item.href}
                  event="social_click"
                  eventProps={{ network: item.key }}
                  external={item.external}
                  aria-label={item.label}
                  className="grid size-9 place-items-center rounded-full bg-white text-[#4d2a80] shadow-sm transition-transform hover:scale-110 sm:size-10"
                >
                  <item.Icon size={22} />
                </TrackedLink>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  )
}
