import { parseRichText, type InlineNode } from '@repo/domain'
import { cn } from '@/lib/cn'

function Inline({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        switch (node.type) {
          case 'text':
            return <span key={i}>{node.value}</span>
          case 'strong':
            return (
              <strong key={i} className="font-black">
                <Inline nodes={node.children} />
              </strong>
            )
          case 'em':
            return (
              <em key={i}>
                <Inline nodes={node.children} />
              </em>
            )
          case 'link': {
            const external = /^https?:/.test(node.href)
            return (
              <a
                key={i}
                href={node.href}
                className="font-bold underline decoration-2 underline-offset-4"
                {...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}
              >
                <Inline nodes={node.children} />
              </a>
            )
          }
        }
      })}
    </>
  )
}

/** Renders the safe Markdown subset as React elements (no raw HTML, ever). */
export function RichText({ value, className }: { value: string; className?: string }) {
  const blocks = parseRichText(value)
  if (blocks.length === 0) return null
  return (
    <div className={cn('space-y-4 text-lg leading-relaxed text-pretty', className)}>
      {blocks.map((block, i) => {
        if (block.type === 'heading')
          return (
            <h3 key={i} className="pt-2 text-xl font-black">
              <Inline nodes={block.children} />
            </h3>
          )
        if (block.type === 'list')
          return (
            <ul key={i} className="space-y-2 pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-current opacity-60" />
                  <span>
                    <Inline nodes={item} />
                  </span>
                </li>
              ))}
            </ul>
          )
        return (
          <p key={i}>
            <Inline nodes={block.children} />
          </p>
        )
      })}
    </div>
  )
}
