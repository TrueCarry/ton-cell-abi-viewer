import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import type { editor as MonacoEditor } from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import { openInJsonHero } from '../../lib/jsonHero'
import { Button, Panel, Tabs } from '../../components/ui'
import type { CellParserStatus } from '../parser/useCellParser'
import type { CellParseResult, OutputFormat } from '../parser/model'
import { formatOutput, getJsonHeroContent, OUTPUT_FORMATS } from './formatOutput'

export type OutputPanelProps = {
  result: CellParseResult | null
  status: CellParserStatus
  format: OutputFormat
  onFormatChange: (format: OutputFormat) => void
}

type CodeEditorLanguage = 'json' | 'yaml'
type MonacoApi = typeof import('monaco-editor/esm/vs/editor/editor.api')
type MonacoEnvironment = { getWorker: (_moduleId: string, label: string) => Worker }
type MonacoGlobal = { MonacoEnvironment?: MonacoEnvironment }

let monacoPromise: Promise<MonacoApi> | undefined
let workersConfigured = false
let themeConfigured = false

function configureWorkers() {
  if (workersConfigured) return

  const monacoGlobal = globalThis as unknown as MonacoGlobal
  monacoGlobal.MonacoEnvironment = {
    getWorker: (_moduleId, label) => {
      if (label === 'json') return new JsonWorker()
      return new EditorWorker()
    },
  }
  workersConfigured = true
}

function configureTheme(monaco: MonacoApi) {
  if (themeConfigured) return

  monaco.editor.defineTheme('ton-minimal-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string', foreground: 'd6cba9' },
      { token: 'number', foreground: '9bcaff' },
      { token: 'keyword', foreground: 'b7afa2' },
      { token: 'type', foreground: '8bd2ad' },
    ],
    colors: {
      'editor.background': '#0f1318',
      'editor.foreground': '#dcd8ce',
      'editor.lineHighlightBackground': '#151a21',
      'editorLineNumber.foreground': '#5d6470',
      'editorLineNumber.activeForeground': '#a7a39a',
      'editor.selectionBackground': '#2b5278',
      'editorCursor.foreground': '#9bcaff',
    },
  })
  themeConfigured = true
}

function loadMonaco() {
  configureWorkers()
  monacoPromise ??= Promise.all([
    import('monaco-editor/min/vs/editor/editor.main.css'),
    import('monaco-editor/esm/vs/editor/editor.api'),
    import('monaco-editor/esm/vs/language/json/monaco.contribution'),
    import('monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution'),
  ]).then(([, monaco]) => {
    configureTheme(monaco)
    return monaco
  })

  return monacoPromise
}

export function OutputPanel(props: OutputPanelProps) {
  const [notice, setNotice] = createSignal('')
  const outputText = createMemo(() =>
    props.result ? formatOutput(props.result, props.format) : '',
  )
  const editorLanguage = createMemo<CodeEditorLanguage | null>(() => {
    if (props.format === 'json' || props.format === 'yaml') return props.format
    return null
  })

  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2200)
  }

  const copyOutput = async () => {
    const text = outputText()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      notify('Output copied')
    } catch {
      notify('Clipboard permission denied')
    }
  }

  const downloadOutput = () => {
    const text = outputText()
    if (!text) return
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ton-cell-${props.format}.${extensionForFormat(props.format)}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    notify('Output downloaded')
  }

  const openJsonHero = () => {
    if (props.result) {
      void openInJsonHero('TON Cell Data', getJsonHeroContent(props.result))
    }
  }

  return (
    <Panel
      class="output-section"
      title={
        <div class="output-title">
          <h2>Parsed Result</h2>
          <span class={`status-badge status-badge--${props.result?.status ?? props.status}`}>
            {props.result?.status ?? props.status}
          </span>
        </div>
      }
      aside={
        <div class="output-actions">
          <Tabs
            ariaLabel="Output mode"
            items={OUTPUT_FORMATS.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
            value={props.format}
            onChange={(format) => props.onFormatChange(format as OutputFormat)}
          />
          <Button type="button" variant="ghost" disabled={!props.result} onClick={copyOutput}>
            Copy
          </Button>
          <Button type="button" variant="ghost" disabled={!props.result} onClick={downloadOutput}>
            Download
          </Button>
          <Button type="button" variant="ghost" disabled={!props.result} onClick={openJsonHero}>
            JSONHero
          </Button>
          <span
            class="notice-pill"
            classList={{ 'is-visible': Boolean(notice()) }}
            role="status"
            aria-live="polite"
          >
            {notice()}
          </span>
        </div>
      }
    >
      <Show
        when={props.result}
        keyed
        fallback={
          <div class="output-empty">Paste a cell or choose an example to start parsing.</div>
        }
      >
        {(result) => (
          <>
            <ResultMeta result={result} />
            <Show
              when={editorLanguage()}
              keyed
              fallback={
                <div class="output-container">
                  <code class="output-textarea">
                    <pre>{outputText()}</pre>
                  </code>
                </div>
              }
            >
              {(language) => <CodeEditor language={language} value={outputText()} />}
            </Show>
          </>
        )}
      </Show>
    </Panel>
  )
}

function CodeEditor(props: { language: CodeEditorLanguage; value: string }) {
  let container!: HTMLDivElement
  let editor: MonacoEditor.IStandaloneCodeEditor | undefined
  let monacoApi: MonacoApi | undefined
  let disposed = false

  onMount(() => {
    const initialLanguage = props.language
    const initialValue = props.value

    void loadMonaco().then((monaco) => {
      if (disposed) return

      monacoApi = monaco
      editor = monaco.editor.create(container, {
        value: initialValue,
        language: initialLanguage,
        theme: 'ton-minimal-dark',
        readOnly: true,
        automaticLayout: true,
        minimap: { enabled: false },
        renderLineHighlight: 'line',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbersMinChars: 3,
        fontSize: 12,
        fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
        scrollbar: {
          alwaysConsumeMouseWheel: false,
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
      })
    })
  })

  createEffect(() => {
    if (!editor || editor.getValue() === props.value) return
    editor.setValue(props.value)
  })

  createEffect(() => {
    const model = editor?.getModel()
    if (!model || !monacoApi) return
    monacoApi.editor.setModelLanguage(model, props.language)
  })

  onCleanup(() => {
    disposed = true
    editor?.dispose()
  })

  return (
    <div class="monaco-shell" data-language={props.language}>
      <div
        ref={container}
        class="monaco-shell__editor"
        aria-label={`${props.language} output editor`}
      />
    </div>
  )
}

function ResultMeta(props: { result: CellParseResult }) {
  return (
    <div class="result-meta">
      <Show when={props.result.normalized} keyed>
        {(normalized) => (
          <span>
            input: {normalized.kind}
            {normalized.source === 'explorer-link' ? ' from explorer link' : ''}
          </span>
        )}
      </Show>
      <Show when={'parser' in props.result ? props.result.parser : undefined} keyed>
        {(parser) => <span>parser: {parser}</span>}
      </Show>
      <Show when={props.result.provenance?.confidence} keyed>
        {(confidence) => <span>confidence: {Math.round(confidence * 100)}%</span>}
      </Show>
      <Show when={props.result.cell} keyed>
        {(cell) => (
          <span>
            root {cell.rootIndex + 1}/{cell.roots} · bits {cell.bits} · refs {cell.refs} · depth{' '}
            {cell.depth}
          </span>
        )}
      </Show>
      <Show when={props.result.warnings.length > 0}>
        <ul class="warning-list">
          <For each={props.result.warnings}>{(warning) => <li>{warning}</li>}</For>
        </ul>
      </Show>
    </div>
  )
}

function extensionForFormat(format: OutputFormat): string {
  if (format === 'json' || format === 'raw') return 'json'
  if (format === 'yaml') return 'yaml'
  return 'txt'
}
