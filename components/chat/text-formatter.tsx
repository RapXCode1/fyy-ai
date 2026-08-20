"use client"

import React, { useState, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, Download } from "lucide-react"

interface TextFormatterProps {
  content: string
}

const CodeBlock = memo(function CodeBlock({ children, className, ...props }: any) {
  const [copied, setCopied] = useState(false)

  // Extract text content from the children array/string
  const textContent = Array.isArray(children) 
    ? children.join('') 
    : typeof children === 'string' 
      ? children 
      : children?.toString() || ''

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(textContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Extract language if present (e.g., language-javascript)
  const language = className ? className.replace(/language-/, '') : ''

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    // Determine file extension
    let ext = 'txt'
    if (language) {
      const extMap: Record<string, string> = {
        javascript: 'js', typescript: 'ts', python: 'py', 
        html: 'html', css: 'css', json: 'json', 
        markdown: 'md', bash: 'sh', shell: 'sh',
        java: 'java', cpp: 'cpp', c: 'c', csharp: 'cs',
        php: 'php', ruby: 'rb', go: 'go', rust: 'rs'
      }
      ext = extMap[language] || language
    }
    
    a.download = `fyy-ai-source.${ext}`
    document.body.appendChild(a)
    a.click()
    
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  }

  return (
    <div className="relative group my-4">
      {language && (
        <div className="absolute top-0 left-0 px-3 py-1 text-xs font-mono text-muted-foreground bg-muted/50 rounded-tl-md rounded-br-md border-b border-r border-border/50">
          {language}
        </div>
      )}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={handleDownload}
          className="p-1.5 rounded-md bg-muted/80 backdrop-blur border border-border/50 text-muted-foreground hover:text-rose-400 hover:bg-muted shadow-sm transition-colors"
          title="Download source file"
        >
          <Download size={14} />
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={handleCopy}
          className="p-1.5 rounded-md bg-muted/80 backdrop-blur border border-border/50 text-muted-foreground hover:text-rose-400 hover:bg-muted shadow-sm flex items-center gap-1.5 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500 pr-1">Copied</span>
            </>
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>
      <pre 
        className="bg-card p-4 pt-10 sm:pt-4 overflow-x-auto border-border"
        style={{ 
          borderRadius: 'var(--radius)', 
          borderWidth: 'var(--theme-border-width)',
          borderStyle: 'solid',
          boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.05)'
        }}
      >
        <code className={`text-xs sm:text-sm font-mono text-foreground ${className || ''}`} {...props}>
          {children}
        </code>
      </pre>
    </div>
  )
})

const TextFormatter = memo(function TextFormatter({ content }: TextFormatterProps) {
  if (!content) return null

  return (
    <div className="text-sm leading-relaxed space-y-2">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({children}) => <div className="mb-4 last:mb-0 text-foreground/90 leading-relaxed">{children}</div>,
          strong: ({children}) => <strong className="font-bold text-rose-400">{children}</strong>,
          em: ({children}) => <em className="italic text-white/90">{children}</em>,
          ul: ({children}) => <ul className="list-disc ml-5 mb-4 space-y-1.5 text-foreground/90">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal ml-5 mb-4 space-y-1.5 text-foreground/90">{children}</ol>,
          li: ({children}) => <li className="pl-1">{children}</li>,
          h1: ({children}) => <h1 className="text-xl font-bold mb-4 mt-6 text-rose-500 border-b border-border/50 pb-1">{children}</h1>,
          h2: ({children}) => <h2 className="text-lg font-bold mb-3 mt-5 text-rose-400">{children}</h2>,
          h3: ({children}) => <h3 className="text-md font-bold mb-2 mt-4 text-foreground">{children}</h3>,
          code: ({node, inline, className, children, ...props}: any) => {
            return inline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-rose-400" {...props}>
                {children}
              </code>
            ) : (
              <CodeBlock className={className} {...props}>{children}</CodeBlock>
            )
          },
          blockquote: ({children}) => <blockquote className="border-l-4 border-rose-500 pl-4 italic my-4 text-muted-foreground">{children}</blockquote>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})

export default TextFormatter
