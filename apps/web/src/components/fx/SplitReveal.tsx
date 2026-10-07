import type { CSSProperties, ElementType } from 'react'

/**
 * Word-by-word entrance, adapted from React Bits "BlurText/SplitText" but
 * implemented with pure CSS (server component, zero client JS). Words keep
 * normal wrapping and the full sentence stays in the accessibility tree.
 */
export function SplitReveal({
  text,
  as: Tag = 'span',
  className,
  delay = 0,
  stagger = 55,
}: {
  text: string
  as?: ElementType
  className?: string
  delay?: number
  stagger?: number
}) {
  const words = text.split(/\s+/).filter(Boolean)
  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block animate-rise motion-reduce:animate-none"
          style={{ animationDelay: `${delay + i * stagger}ms`, '--rise': '0.45em' } as CSSProperties}
        >
          {word}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  )
}
