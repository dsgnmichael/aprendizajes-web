/** App-shell fallback while a profile streams in (first visit to a new slug). */
export function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando perfil" className="mx-auto w-full max-w-wide px-4 pt-6 sm:px-6 lg:px-10">
      <div className="h-10 w-2/3 max-w-md animate-pulse rounded-full bg-brand-mist" />
      <div className="mt-3 h-12 w-1/2 max-w-sm animate-pulse rounded-full bg-brand-mist/70" />
      <div className="mt-8 h-[min(70svh,560px)] animate-pulse rounded-panel bg-brand/15" />
    </div>
  )
}
