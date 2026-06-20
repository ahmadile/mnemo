'use client'

// Pyodide service — lazy-loads Pyodide from CDN on first use
// Runs Python code in the browser via WebAssembly (no server needed)
// Captures stdout/stderr and returns structured output

let pyodidePromise: Promise<any> | null = null
let pyodideInstance: any = null

const PYODIDE_VERSION = '0.27.2'
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

export interface RunResult {
  success: boolean
  stdout: string
  stderr: string
  error?: string
  errorType?: string  // e.g. "SyntaxError", "NameError"
  traceback?: string[]
  executionTime: number  // ms
}

// Load Pyodide (singleton — only loads once)
export async function loadPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance
  if (pyodidePromise) return pyodidePromise

  pyodidePromise = new Promise(async (resolve, reject) => {
    try {
      // Load the Pyodide script from CDN
      const script = document.createElement('script')
      script.src = `${PYODIDE_CDN}pyodide.js`
      script.onload = async () => {
        try {
          // @ts-ignore - loadPyodide is injected by the script
          const pyodide = await window.loadPyodide({
            indexURL: PYODIDE_CDN,
          })

          // Configure stdout/stderr capture
          pyodide.setStdout({ batched: (text: string) => {
            stdoutBuffer += text + '\n'
          }})
          pyodide.setStderr({ batched: (text: string) => {
            stderrBuffer += text + '\n'
          }})

          // Pre-load common packages for data science missions
          // (loaded in background, doesn't block initial use)
          pyodide.loadPackage(['micropip']).then(() => {
            console.log('[Pyodide] micropip loaded')
          }).catch(() => {})

          pyodideInstance = pyodide
          console.log('[Pyodide] Loaded successfully v' + PYODIDE_VERSION)
          resolve(pyodide)
        } catch (e) {
          reject(e)
        }
      }
      script.onerror = () => reject(new Error('Failed to load Pyodide from CDN'))
      document.head.appendChild(script)
    } catch (e) {
      reject(e)
    }
  })

  return pyodidePromise
}

// Buffers for stdout/stderr (reset before each run)
let stdoutBuffer = ''
let stderrBuffer = ''

// Run Python code and return structured output
export async function runPython(code: string): Promise<RunResult> {
  const startTime = performance.now()

  try {
    const pyodide = await loadPyodide()

    // Reset buffers
    stdoutBuffer = ''
    stderrBuffer = ''

    // Run the code
    await pyodide.runPythonAsync(code)

    const executionTime = Math.round(performance.now() - startTime)

    return {
      success: true,
      stdout: stdoutBuffer.trim(),
      stderr: stderrBuffer.trim(),
      executionTime,
    }
  } catch (error: any) {
    const executionTime = Math.round(performance.now() - startTime)

    // Parse Python traceback
    const errorText = error.message || String(error)
    const tracebackLines = errorText.split('\n').filter((l: string) => l.trim())

    // Extract error type (last line usually: "NameError: name 'x' is not defined")
    const lastLine = tracebackLines[tracebackLines.length - 1] || ''
    const errorMatch = lastLine.match(/^(\w+Error|\w+Exception):\s*(.*)$/)
    const errorType = errorMatch?.[1] || 'Error'
    const errorMessage = errorMatch?.[2] || lastLine

    return {
      success: false,
      stdout: stdoutBuffer.trim(),
      stderr: stderrBuffer.trim() || errorText,
      error: errorMessage,
      errorType,
      traceback: tracebackLines,
      executionTime,
    }
  }
}

// Pre-load common data science packages (optional, call in background)
export async function preloadPackages(packages: string[] = ['numpy', 'pandas']) {
  try {
    const pyodide = await loadPyodide()
    await pyodide.loadPackage(packages)
    console.log('[Pyodide] Packages loaded:', packages.join(', '))
  } catch (e) {
    console.warn('[Pyodide] Failed to load packages:', e)
  }
}

// Check if Pyodide is already loaded
export function isPyodideLoaded(): boolean {
  return pyodideInstance !== null
}
