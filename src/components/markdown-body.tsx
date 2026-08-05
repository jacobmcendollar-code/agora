import ReactMarkdown from "react-markdown";

type Props = {
  text: string;
  className?: string;
};

/**
 * Safe, limited markdown for posts and comments.
 * Supports: paragraphs, bold, italic, links, lists, block quotes, inline code.
 * No raw HTML, images, or headings.
 */
export function MarkdownBody({ text, className = "" }: Props) {
  if (!text?.trim()) return null;

  return (
    <div className={`markdown-body space-y-3 text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="whitespace-pre-wrap break-words">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-900 dark:text-zinc-50">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500 hover:underline"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="break-words">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-emerald-500 bg-zinc-50 py-1 pl-3 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] dark:bg-zinc-800">
              {children}
            </code>
          ),
          // Disallow everything else by rendering as plain text container
          h1: ({ children }) => <p className="font-semibold">{children}</p>,
          h2: ({ children }) => <p className="font-semibold">{children}</p>,
          h3: ({ children }) => <p className="font-semibold">{children}</p>,
          img: () => null,
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-800">
              {children}
            </pre>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}