'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check, ChevronRight, Loader2, PartyPopper, ChevronDown, User, MessageCircle, Mail, Heart } from 'lucide-react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  SUPPORT_AREAS, 
  SUPPORT_AREA_LABELS, 
  type SupportArea,
  type ParentClubRegistrationInput,
  parentClubRegistrationSchema
} from '@repo/domain'
import { QRCodeSVG } from 'qrcode.react'
import { buildGoogleCalendarUrl, CLUB_EVENT } from '@/lib/google-calendar'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/cn'
import { useRouter } from 'next/navigation'

const STEPS = [
  { id: 1, title: 'Datos', icon: User, fields: ['fullName', 'birthDate'] as const },
  { id: 2, title: 'WhatsApp', icon: MessageCircle, fields: ['whatsapp'] as const },
  { id: 3, title: 'Email', icon: Mail, fields: ['email'] as const },
  { id: 4, title: 'Áreas', icon: Heart, fields: ['supportAreas', 'otherSupport'] as const },
]

const COUNTRIES = [
  { code: 'VE', dialCode: '+58', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'CO', dialCode: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: 'EC', dialCode: '+593', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'PE', dialCode: '+51', name: 'Perú', flag: '🇵🇪' },
  { code: 'CL', dialCode: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: 'AR', dialCode: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: 'UY', dialCode: '+598', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'PY', dialCode: '+595', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'BO', dialCode: '+591', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'BR', dialCode: '+55', name: 'Brasil', flag: '🇧🇷' },
  { code: 'MX', dialCode: '+52', name: 'México', flag: '🇲🇽' },
  { code: 'PA', dialCode: '+507', name: 'Panamá', flag: '🇵🇦' },
  { code: 'CR', dialCode: '+506', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'GT', dialCode: '+502', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'DO', dialCode: '+1', name: 'Rep. Dominicana', flag: '🇩🇴' },
  { code: 'PR', dialCode: '+1', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'ES', dialCode: '+34', name: 'España', flag: '🇪🇸' },
  { code: 'PT', dialCode: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: 'US', dialCode: '+1', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'IT', dialCode: '+39', name: 'Italia', flag: '🇮🇹' },
]

export function ParentClubForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [success, setSuccess] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [createdEmail, setCreatedEmail] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [validatingStep, setValidatingStep] = useState(false)
  const [maxDate, setMaxDate] = useState<string | undefined>()
  
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]!)
  const [phoneLocal, setPhoneLocal] = useState('')
  const [showCountries, setShowCountries] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<p className="mt-4 text-sm text-gray-600">Nuestro equipo está revisando las solicitudes para la sesión gratuita. Nos pondremos en contacto contigo muy pronto para confirmar si has sido seleccionado.</p>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-dashed border-brand/30 bg-[#f4f1fa] p-6 text-center">
          <p className="text-xs font-bold text-brand uppercase tracking-wider">Tu credencial</p>
          <p className="mt-2 text-base font-bold text-ink break-all">{createdEmail}</p>
          <div className="mt-4 flex justify-center">
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <QRCodeSVG value={verifyUrl} size={140} level="M" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Guarda tu comprobante en tu celular</p>
        </div>

        <div className="mt-4 space-y-1.5 rounded-xl bg-muted/30 p-4">
          <p className="text-sm font-bold text-ink">📅 Sábado 31 de octubre de 2026</p>
          <p className="text-sm text-ink-muted">🕙 10:00 AM - 12:00 PM</p>
          <p className="text-sm text-ink-muted">📍 Av. El Paseo, Los Rosales, Caracas</p>
          <a href={CLUB_EVENT.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-medium text-brand underline">
            📌 Ver en Google Maps
          </a>
        </div>

        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCalendarClick}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-brand-deep"
        >
          📅 Volver al inicio
        </a>

        <button
          type="button"
          onClick={handleCancel}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-red-200 px-6 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
        >
          
        </button>

        <button
          type="button"
          onClick={handleGoHome}
          className="mt-3 flex w-full items-center justify-center text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
      
      {/* Stepper Animado con Iconos */}
      <div className="pt-8 pb-4">
        <div className="relative grid grid-cols-4 max-w-sm mx-auto px-2">
          
          <div className="absolute left-[12.5%] right-[12.5%] top-[1.125rem] h-[2.3px] bg-gray-200 z-0 rounded-full" />
          
          <motion.div 
            className="absolute left-[12.5%] top-[1.125rem] h-[2.3px] bg-[#b7ace5] z-0 origin-left rounded-full"
            style={{ width: '75%' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: (step - 1) / 3 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {STEPS.map((s) => {
            const Icon = s.icon
            const isCompleted = step > s.id
            const isCurrent = step === s.id
            
            return (
              <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={isCurrent ? "motion-safe:animate-[float_4s_ease-in-out_infinite]" : ""}>
                  <motion.div 
                    initial={false}
                    animate={isCompleted ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.4, times: [0, 0.5, 1] }}
                    className={cn(
                      "grid size-9 place-items-center rounded-full border-2 transition-colors duration-300",
                      isCompleted ? "bg-brand border-brand text-white shadow-md" 
                      : isCurrent ? "bg-[#b7ace5] border-[#b7ace5] text-white shadow-md"
                      : "bg-white border-gray-200 text-gray-400"
                    )}
                  >
                    {isCompleted ? <Check className="size-5" /> : <Icon className="size-4" />}
                  </motion.div>
                </div>
                <span className={cn(
                  "text-[0.65rem] font-bold uppercase tracking-wider transition-colors duration-300 text-center",
                  step >= s.id ? "text-brand" : "text-gray-400"
                )}>
                  {s.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <form onSubmit={handleSubmit(onSubmit as any)} className="px-8 pb-8 sm:px-12 sm:pb-12 pt-4 flex flex-col min-h-[380px]">
        <AnimatePresence mode="wait">
          
          {/* PASO 1 */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-5">
              <div className="mb-2">
                <h2 className="text-2xl font-black text-ink">Tus datos</h2>
                <p className="text-sm text-ink-muted">Comencemos con lo básico para conocerte.</p>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Nombre y Apellido <span className="text-brand">*</span>
                </label>
                <input
                  type="text"
                  {...register('fullName')}
                  className={cn(
                    "w-full rounded-full border-2 p-3.5 px-6 text-base transition-colors focus:outline-none",
                    errors.fullName ? "border-red-400 focus:border-red-500 bg-red-50" : "border-gray-200 focus:border-brand focus:bg-white bg-gray-50"
                  )}
                  placeholder="Ej: María Pérez"
                />
                {errors.fullName && <span className="text-red-500 text-xs font-bold mt-1.5 block pl-4">{errors.fullName.message}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Fecha de nacimiento <span className="text-brand">*</span>
                </label>
                <input
                  type="date"
                  max={maxDate}
                  {...register('birthDate')}
                  className={cn(
                    "w-full rounded-full border-2 p-3.5 px-6 text-base transition-colors focus:outline-none",
                    errors.birthDate ? "border-red-400 focus:border-red-500 bg-red-50" : "border-gray-200 focus:border-brand focus:bg-white bg-gray-50"
                  )}
                />
                {errors.birthDate && <span className="text-red-500 text-xs font-bold mt-1.5 block pl-4">{errors.birthDate.message}</span>}
              </div>
            </motion.div>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-5">
              <div className="mb-2">
                <h2 className="text-2xl font-black text-ink">Tu WhatsApp</h2>
                <p className="text-sm text-ink-muted">
                  Debe ser un número con WhatsApp activo para recibir información por esta vía.
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Número de teléfono <span className="text-brand">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowCountries(!showCountries)}
                      className="h-full flex items-center justify-between gap-1 rounded-full border-2 border-gray-200 bg-gray-50 px-4 text-base focus:outline-none focus:border-brand min-w-[100px]"
                    >
                      <span className="font-medium flex items-center gap-1.5">
                        <span className="text-xl">{selectedCountry.flag}</span>
                        <span>{selectedCountry.dialCode}</span>
                      </span>
                      <ChevronDown className={cn("size-3 text-gray-400 transition-transform", showCountries && "rotate-180")} />
                    </button>

                    {showCountries && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowCountries(false)} />
                        <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 max-h-72 overflow-hidden flex flex-col">
                          <div className="p-2 border-b border-gray-100">
                            <input
                              type="text"
                              placeholder="Buscar país..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full p-2.5 text-sm rounded-full border border-gray-200 focus:border-brand focus:outline-none px-4"
                              autoFocus
                            />
                          </div>
                          <div className="overflow-y-auto">
                            {filteredCountries.length === 0 && (
                              <p className="text-center text-sm text-gray-400 p-4">Sin resultados</p>
                            )}
                            {filteredCountries.map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(c)
                                  setShowCountries(false)
                                  setCountrySearch('')
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-gray-50 text-sm",
                                  selectedCountry.code === c.code && "bg-[#ece7f3] text-brand font-bold"
                                )}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="text-lg">{c.flag}</span>
                                  {c.name}
                                </span>
                                <span className="text-gray-400 font-mono">{c.dialCode}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <input
                    type="tel"
                    inputMode="tel"
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value.replace(/[^\d\s]/g, ''))}
                    className={cn(
                      "flex-1 min-w-0 rounded-full border-2 p-3.5 px-6 text-base transition-colors focus:outline-none",
                      errors.whatsapp ? "border-red-400 focus:border-red-500 bg-red-50" : "border-gray-200 focus:border-brand focus:bg-white bg-gray-50"
                    )}
                    placeholder="412 1234567"
                  />
                </div>
                {errors.whatsapp && <span className="text-red-500 text-xs font-bold mt-1.5 block pl-4">{errors.whatsapp.message}</span>}
              </div>
            </motion.div>
          )}

          {/* PASO 3 */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-5">
              <div className="mb-2">
                <h2 className="text-2xl font-black text-ink">Tu correo electrónico</h2>
                <p className="text-sm text-ink-muted">
                  Correo que revises con frecuencia, recibirás en él una confirmación.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Correo electrónico <span className="text-brand">*</span>
                </label>
                <input
                  type="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  {...register('email')}
                  className={cn(
                    "w-full rounded-full border-2 p-3.5 px-6 text-base transition-colors focus:outline-none",
                    errors.email ? "border-red-400 focus:border-red-500 bg-red-50" : "border-gray-200 focus:border-brand focus:bg-white bg-gray-50"
                  )}
                  placeholder="tucorreo@ejemplo.com"
                />
                {errors.email && <span className="text-red-500 text-xs font-bold mt-1.5 block pl-4">{errors.email.message}</span>}
              </div>
            </motion.div>
          )}

          {/* PASO 4 */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-5">
              <div className="mb-2">
                <h2 className="text-2xl font-black text-ink">¿Qué te gustaría recibir o aprender? <span className="text-brand">*</span></h2>
                <p className="text-sm text-ink-muted">Si pertenecieras a un club para padres, selecciona los temas que más te interesen.</p>
              </div>
              
              <div className="flex flex-wrap gap-2.5">
                {SUPPORT_AREAS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArea(area)}
                    className={cn(
                      "rounded-full px-4 py-2.5 text-sm font-bold transition-all border",
                      selectedAreas.includes(area)
                        ? "bg-[#ece7f3] border-brand text-brand"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    {SUPPORT_AREA_LABELS[area]}
                  </button>
                ))}
              </div>
              {errors.supportAreas && (
                <span className="text-[#b7ace5] text-sm font-bold block">{errors.supportAreas.message}</span>
              )}

              <div className="mt-2">
                <label className="script text-xl text-[#4d2a80] mb-1.5 block">
                  ¿Qué esperarías encontrar en este espacio pensado para ti como representante? <span className="text-gray-400 font-sans text-sm normal-case">(opcional)</span>
                </label>
                <textarea
                  {...register('otherSupport')}
                  maxLength={250}
                  className={cn(
                    "w-full rounded-[1.5rem] border-2 p-4 text-base transition-colors focus:outline-none min-h-[100px] resize-none",
                    errors.otherSupport ? "border-red-400 focus:border-red-500 bg-red-50" : "border-gray-200 focus:border-brand focus:bg-white bg-gray-50"
                  )}
                  placeholder="Cuéntanos qué esperas de este espacio..."
                />
                <div className="flex justify-between items-center mt-1.5 px-2">
                  {errors.otherSupport 
                    ? <span className="text-red-500 text-xs font-bold">{errors.otherSupport.message}</span>
                    : <span />
                  }
                  <span className={cn(
                    "text-xs font-medium tabular-nums",
                    otherSupportValue.length > 230 ? "text-amber-600" : "text-gray-400"
                  )}>
                    {otherSupportValue.length}/250
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {submitError && <p className="mt-4 text-sm text-red-600 font-bold">{submitError}</p>}

        <div className="mt-auto pt-8 flex justify-between items-center gap-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className={cn(
              "px-6 py-3 rounded-full font-bold transition-all text-sm",
              step === 1 ? "opacity-0 pointer-events-none" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            Atrás
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3.5 text-sm font-black text-white shadow-md transition-all hover:bg-brand-deep hover:scale-[1.02]"
            >
              Siguiente <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3.5 text-sm font-black text-white shadow-md transition-all hover:bg-brand-deep hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Confirmar asistencia'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
