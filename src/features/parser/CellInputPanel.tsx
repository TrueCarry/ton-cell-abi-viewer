import { For, Show } from 'solid-js'
import { Badge, Button, Panel, Select, TextArea } from '../../components/ui'
import type { ExampleItem } from './examples'

export type CellInputPanelProps = {
  value: string
  pending: boolean
  examples: ExampleItem[]
  selectedExampleId: string
  onChange: (value: string) => void
  onUseExample: () => void
  onSelectExample: (id: string) => void
}

export function CellInputPanel(props: CellInputPanelProps) {
  const exampleOptions = () =>
    props.examples.map((example) => ({
      value: example.id,
      label: example.title,
      description: example.description,
    }))

  return (
    <Panel
      title={<h2>Input Cell</h2>}
      aside={
        <div class="format-info" aria-label="Supported formats">
          <span class="format-badge">Base64</span>
          <span class="format-badge">Hex</span>
          <span class="format-badge">te6cc</span>
          <span class="format-badge">Explorer link</span>
        </div>
      }
    >
      <TextArea
        value={props.value}
        onInput={(event) => props.onChange(event.currentTarget.value)}
        placeholder="Paste a TON BOC cell, te6cc string, hex, or explorer link..."
        rows={8}
      />
      <div class="panel-actions">
        <Button variant="ghost" type="button" onClick={props.onUseExample}>
          Load selected example
        </Button>
        <Show when={props.pending}>
          <span class="pending-label">Parsing...</span>
        </Show>
      </div>
      <div class="example-gallery">
        <div class="example-gallery__header">
          <div>
            <h3>Example gallery</h3>
            <p>Comments, jettons, NFTs, transactions, blocks and StateInit payloads.</p>
          </div>
          <Select
            value={props.selectedExampleId}
            options={exampleOptions()}
            onChange={props.onSelectExample}
            aria-label="Choose example"
          />
        </div>
        <div class="example-grid">
          <For each={props.examples}>
            {(example) => (
              <button
                type="button"
                class={`example-card ${props.selectedExampleId === example.id ? 'is-selected' : ''}`}
                onClick={() => props.onSelectExample(example.id)}
              >
                <span class="example-card__category">{example.category}</span>
                <strong>{example.title}</strong>
                <span>{example.description}</span>
                <span class="example-card__tags">
                  <For each={example.tags}>{(tag) => <Badge>{tag}</Badge>}</For>
                </span>
              </button>
            )}
          </For>
        </div>
      </div>
    </Panel>
  )
}
