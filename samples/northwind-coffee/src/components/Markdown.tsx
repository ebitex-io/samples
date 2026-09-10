import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renders one RichText field's markdown.
 *
 * The SDK hands markdown to whatever component you give `<ContentProvider markdown>`;
 * it deliberately does not bring a markdown renderer of its own, because the
 * choice of one is a consuming app's business.
 *
 * The classes are written out per element rather than reached for from a
 * typography plugin, so this file is the single place the site's prose style
 * lives and there is no second styling system to reconcile.
 */
export function Markdown({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-4 leading-relaxed last:mb-0">{children}</p>,
        h2: ({ children }) => (
          <h2 className="mt-10 mb-3 font-display text-2xl text-ink first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-8 mb-2 font-display text-xl text-ink first:mt-0">{children}</h3>
        ),
        ul: ({ children }) => <ul className="mb-4 list-disc space-y-1.5 pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1.5 pl-5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ href, children }) => (
          <a href={href} className="text-accent underline underline-offset-2">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-4 border-l-2 border-accent pl-4 text-ink-muted italic">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>
        ),
        table: ({ children }) => (
          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border-b border-line pb-2 font-medium text-ink">{children}</th>
        ),
        td: ({ children }) => <td className="border-b border-line py-2 align-top">{children}</td>,
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}

export default Markdown
