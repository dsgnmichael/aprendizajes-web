import { SOCIAL_KEYS, type SocialLinks as Social } from '@repo/domain'
import { Globe } from 'lucide-react'
import type { ComponentType } from 'react'
import { TrackedLink } from '@/components/ui/TrackedLink'
import { cn } from '@/lib/cn'
import { FacebookIcon, InstagramIcon, LinkedInIcon, TikTokIcon, YouTubeIcon } from './BrandIcons'

const META: Record<keyof Social, { label: string; Icon: ComponentType<{ size?: number }> }> = {
  instagram: { label: 'Instagram', Icon: InstagramIcon },
  tiktok: { label: 'TikTok', Icon: TikTokIcon },
  facebook: { label: 'Facebook', Icon: FacebookIcon },
  linkedin: { label: 'LinkedIn', Icon: LinkedInIcon },
  youtube: { label: 'YouTube', Icon: YouTubeIcon },
  website: { label: 'Sitio web', Icon: ({ size }) => <Globe size={size} strokeWidth={1.8} aria-hidden="true" /> },
}

export function activeSocials(social: Social) {
  return SOCIAL_KEYS.filter((key) => /^https:\/\//.test(social[key]))
}

/** Social links with ≥44px touch targets and analytics. */
export function SocialLinks({
  social,
  owner,
  tone = 'brand',
  className,
}: {
  social: Social
  owner: string
  tone?: 'brand' | 'onBrand' | 'ink'
  className?: string
}) {
  const keys = activeSocials(social)
  if (keys.length === 0) return null
  return (
    <ul className={cn('flex flex-wrap items-center gap-1', className)} aria-label={`Redes sociales de ${owner}`}>
      {keys.map((key) => {
        const { label, Icon } = META[key]
        return (
          <li key={key}>
            <TrackedLink
              href={social[key]}
              event="social_click"
              eventProps={{ network: key }}
              external
              aria-label={`${label} de ${owner} (se abre en una pestaña nueva)`}
              className={cn(
                'grid size-11 place-items-center rounded-full transition-[transform,background-color,color] duration-200 ease-out-expo hover:-translate-y-0.5 active:scale-95',
                tone === 'onBrand' && 'text-on-brand/90 hover:bg-on-brand/12 hover:text-on-brand',
                tone === 'brand' && 'text-brand hover:bg-brand/10',
                tone === 'ink' && 'text-ink hover:bg-ink/6',
              )}
            >
              <Icon size={20} />
            </TrackedLink>
          </li>
        )
      })}
    </ul>
  )
}
