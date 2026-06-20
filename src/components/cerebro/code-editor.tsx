'use client'

import { useMemo } from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'

// Language components - import statically to avoid ordering issues
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-bash'

const languageMap: Record<string, string> = {
  Python: 'python',
  python: 'python',
  SQL: 'sql',
  sql: 'sql',
  JavaScript: 'javascript',
  javascript: 'javascript',
  Bash: 'bash',
}

interface CodeEditorProps {
  value: string
  onChange: (code: string) => void
  language?: string // "Python", "SQL", "JavaScript"
  placeholder?: string
  minHeight?: number
}

export function CodeEditor({
  value,
  onChange,
  language = 'Python',
  placeholder = 'Écrivez votre code ici...',
  minHeight = 320,
}: CodeEditorProps) {
  const prismLanguage = languageMap[language] || 'python'

  // Build line numbers gutter
  const lineCount = useMemo(() => Math.max(value.split('\n').length, 1), [value])

  const lineNumbers = useMemo(
    () => Array.from({ length: Math.max(lineCount, 12) }, (_, i) => i + 1).join('\n'),
    [lineCount]
  )

  const highlight = (code: string) => {
    try {
      const grammar = Prism.languages[prismLanguage]
      if (grammar) {
        return Prism.highlight(code, grammar, prismLanguage)
      }
    } catch (e) {
      // fall through to plain
    }
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  return (
    <div className="relative flex bg-[#0d1117] font-mono text-sm" style={{ minHeight }}>
      {/* Line numbers gutter */}
      <pre
        aria-hidden="true"
        className="select-none text-right text-zinc-600 bg-[#0d1117] py-4 pl-3 pr-3 border-r border-zinc-800/80 leading-6 text-xs tabular-nums"
        style={{ minWidth: '3rem' }}
      >
        {lineNumbers}
      </pre>

      {/* Editor area */}
      <div className="flex-1 relative overflow-auto">
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={highlight}
          padding={16}
          placeholder={placeholder}
          className="mnemo-editor font-mono text-sm leading-6"
          style={{
            fontFamily: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: 13,
            minHeight,
            color: '#e6edf3',
            background: 'transparent',
          }}
          textareaClassName="mnemo-editor-textarea"
          onKeyUp={undefined}
        />
      </div>

      {/* Language badge */}
      <div className="absolute top-2 right-3 text-[10px] uppercase tracking-wider text-zinc-600 pointer-events-none">
        {language}
      </div>

      <style jsx global>{`
        .mnemo-editor-textarea {
          outline: none !important;
          caret-color: #10b981 !important;
        }
        .mnemo-editor-textarea::placeholder {
          color: #484f58 !important;
        }
        .mnemo-editor pre {
          background: transparent !important;
        }
        /* Prism token colors (GitHub Dark inspired) */
        .mnemo-editor .token.comment,
        .mnemo-editor .token.prolog,
        .mnemo-editor .token.doctype,
        .mnemo-editor .token.cdata {
          color: #8b949e;
          font-style: italic;
        }
        .mnemo-editor .token.punctuation {
          color: #c9d1d9;
        }
        .mnemo-editor .token.property,
        .mnemo-editor .token.tag,
        .mnemo-editor .token.boolean,
        .mnemo-editor .token.number,
        .mnemo-editor .token.constant,
        .mnemo-editor .token.symbol {
          color: #79c0ff;
        }
        .mnemo-editor .token.selector,
        .mnemo-editor .token.attr-name,
        .mnemo-editor .token.string,
        .mnemo-editor .token.char,
        .mnemo-editor .token.builtin,
        .mnemo-editor .token.inserted {
          color: #a5d6ff;
        }
        .mnemo-editor .token.operator,
        .mnemo-editor .token.entity,
        .mnemo-editor .token.url,
        .mnemo-editor .token.variable {
          color: #ff7b72;
        }
        .mnemo-editor .token.atrule,
        .mnemo-editor .token.attr-value,
        .mnemo-editor .token.function,
        .mnemo-editor .token.class-name {
          color: #d2a8ff;
        }
        .mnemo-editor .token.keyword {
          color: #ff7b72;
          font-weight: 600;
        }
        .mnemo-editor .token.regex,
        .mnemo-editor .token.important {
          color: #ffa657;
        }
        .mnemo-editor .token.decorator,
        .mnemo-editor .token.annotation {
          color: #ffa657;
        }
      `}</style>
    </div>
  )
}
