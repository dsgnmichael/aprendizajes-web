
export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60svh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="script text-[5rem] leading-none text-brand">ups</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight uppercase italic">No encontramos esta página</h1>
      <p className="mt-3 text-lg text-ink-muted">Puede que el enlace haya cambiado o que el perfil ya no esté disponible.</p>
      <a href="/" className="mt-8 inline-flex min-h-12 items-center rounded-button bg-brand px-7 font-black tracking-wide text-on-brand uppercase hover:bg-brand-deep">
        Ver el equipo
      </a>
    </section>
  )
}
