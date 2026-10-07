import { cn } from '@/lib/cn'

/**
 * Circular "sticker" with text on a path that slowly rotates around a value.
 * Decorative: the information it carries is rendered as text elsewhere.
 */
export function RotatingBadge({ value, ring, className }: { value: string; ring: string; className?: string }) {
  const text = `${ring} · ${ring} · `
  return (
    <div aria-hidden="true" className={cn('relative grid size-28 place-items-center md:size-32', className)}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full animate-spin-slow motion-reduce:animate-none">
        <defs>
          <path id="badge-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <text className="fill-current text-[10.5px] font-bold tracking-[0.2em] uppercase">
          <textPath href="#badge-circle" textLength="288">
            {text}
          </textPath>
        </text>
      </svg>
      <span className="text-3xl leading-none font-black tracking-tight italic md:text-4xl">{value}</span>
    </div>
  )
}
