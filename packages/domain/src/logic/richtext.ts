/**
 * Minimal, safe rich-text format for CMS content.
 *
 * Instead of storing/rendering HTML we accept a tiny Markdown subset and parse
 * it into a plain AST. Renderers turn the AST into React elements, so there
 * is no `dangerouslySetInnerHTML` and no way to inject markup or scripts.
 *
 * Supported: paragraphs, `- ` bullet lists, `## ` subheadings, **bold**,
 * *italic* and [links](https://…) restricted to safe schemes.
 */

export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'strong'; children: InlineNode[] }
  | { type: 'em'; children: InlineNode[] }
  | { type: 'link'; href: string; children: InlineNode[] }

export type BlockNode =
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'heading'; children: InlineNode[] }
  | { type: 'list'; items: InlineNode[][] }

const SAFE_LINK = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i

const INLINE = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)\s]+)\))/

export function parseInline(input: string): InlineNode[] {
  const nodes: InlineNode[] = []
  let rest = input
  while (rest.length > 0) {
    const match = INLINE.exec(rest)
    if (!match) {
      nodes.push({ type: 'text', value: rest })
      break
    }
    if (match.index > 0) nodes.push({ type: 'text', value: rest.slice(0, match.index) })
    if (match[2] !== undefined) nodes.push({ type: 'strong', children: parseInline(match[2]) })
    else if (match[4] !== undefined) nodes.push({ type: 'em', children: parseInline(match[4]) })
    else if (match[6] !== undefined && match[7] !== undefined) {
      const href = match[7]
      nodes.push(
        SAFE_LINK.test(href)
          ? { type: 'link', href, children: parseInline(match[6]) }
          : { type: 'text', value: match[6] },
      )
    }
    rest = rest.slice(match.index + match[0].length)
  }
  return nodes
}

export function parseRichText(input: string): BlockNode[] {
  const blocks: BlockNode[] = []
  const chunks = input.replace(/\r\n?/g, '\n').split(/\n{2,}/)
  for (const chunk of chunks) {
    const lines = chunk.split('\n').filter((l) => l.trim() !== '')
    if (lines.length === 0) continue
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      blocks.push({ type: 'list', items: lines.map((l) => parseInline(l.replace(/^\s*[-*]\s+/, ''))) })
    } else if (lines.length === 1 && /^#{1,3}\s+/.test(lines[0] ?? '')) {
      blocks.push({ type: 'heading', children: parseInline((lines[0] ?? '').replace(/^#{1,3}\s+/, '')) })
    } else {
      blocks.push({ type: 'paragraph', children: parseInline(lines.join(' ')) })
    }
  }
  return blocks
}

/** Plain-text version (for meta descriptions, JSON-LD, previews). */
export function richTextToPlain(input: string): string {
  const flatten = (nodes: InlineNode[]): string =>
    nodes.map((n) => (n.type === 'text' ? n.value : flatten(n.children))).join('')
  return parseRichText(input)
    .map((b) => (b.type === 'list' ? b.items.map(flatten).join(', ') : flatten(b.children)))
    .join(' ')
    .trim()
}
