import { createSignal, onMount } from 'solid-js'
import './App.css'
import {
  CellInputPanel,
  EXAMPLE_GALLERY,
  ParserOptionsPanel,
  useCellParser,
} from './features/parser'
import type { OutputFormat } from './features/parser'
import { OutputPanel } from './features/output'

function App() {
  const parser = useCellParser()
  const [format, setFormat] = createSignal<OutputFormat>('json')
  const [selectedExampleId, setSelectedExampleId] = createSignal(EXAMPLE_GALLERY[0].id)

  const applyExample = (id: string) => {
    const example = EXAMPLE_GALLERY.find((item) => item.id === id) ?? EXAMPLE_GALLERY[0]
    setSelectedExampleId(example.id)
    parser.setInput(example.cell)
    parser.setOptions({ customTlb: example.tlb ?? '' })
    setFormat(example.mode)
  }

  onMount(() => {
    applyExample(EXAMPLE_GALLERY[0].id)
  })

  return (
    <div class="app-shell">
      <header class="command-header">
        <nav class="topbar" aria-label="Application navigation">
          <a
            class="brand-mark"
            href="https://github.com/TrueCarry/ton-cell-abi-viewer"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="brand-mark__glyph">TON</span>
            <span>
              <strong>Cell ABI Viewer</strong>
              <small>Cell analysis</small>
            </span>
          </a>
        </nav>
      </header>

      <main class="workspace-grid">
        <div class="workspace-column workspace-column--input">
          <CellInputPanel
            value={parser.input()}
            pending={parser.isParsing()}
            examples={EXAMPLE_GALLERY}
            selectedExampleId={selectedExampleId()}
            onChange={(value) => parser.setInput(value)}
            onUseExample={() => applyExample(selectedExampleId())}
            onSelectExample={applyExample}
          />
          <ParserOptionsPanel options={parser.options()} onChange={parser.setOptions} />
        </div>
        <div class="workspace-column workspace-column--output">
          <OutputPanel
            result={parser.result()}
            status={parser.status()}
            format={format()}
            onFormatChange={setFormat}
          />
        </div>
      </main>

      <footer class="site-footer">
        <p>Built by @TrueCarry</p>
        <a
          href="https://github.com/TrueCarry/ton-cell-abi-viewer"
          target="_blank"
          rel="noopener noreferrer"
        >
          View source
        </a>
      </footer>
    </div>
  )
}

export default App
