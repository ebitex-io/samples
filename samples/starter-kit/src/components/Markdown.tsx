import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renders one RichText field's markdown. The SDK hands markdown to whatever component the provider
 * is given and brings no renderer of its own; the classes live here, in one place.
 */
export function Markdown({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-4 leading-relaxed last:mb-0">{children}</p>,
        h2: ({ children }) => <h2 className="mt-8 mb-3 text-2xl font-semibold text-ink first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="mt-6 mb-2 text-xl font-semibold text-ink first:mt-0">{children}</h3>,
        ul: ({ children }) => <ul className="mb-4 list-disc space-y-1.5 pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1.5 pl-5">{children}</ol>,
        strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
        a: ({ href, children }) => (
          <a href={href} className="text-accent underline underline-offset-2">
            {children}
          </a>
        ),
        blockquote: ({ children }) => <blockquote className="mb-4 border-l-2 border-accent pl-4 italic">{children}</blockquote>,
        code: ({ children }) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>,
        table: ({ children }) => (
          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="border-b border-line pb-2 font-medium text-ink">{children}</th>,
        td: ({ children }) => <td className="border-b border-line py-2 align-top">{children}</td>,
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}

export default Markdown
