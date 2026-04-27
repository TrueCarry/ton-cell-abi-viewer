import { Panel, TextArea } from '../../components/ui'
import { PARSER_OPTION_DESCRIPTIONS, type ParserOptions } from './model'

export type ParserOptionsPanelProps = {
  options: ParserOptions
  onChange: (patch: Partial<ParserOptions>) => void
}

export function ParserOptionsPanel(props: ParserOptionsPanelProps) {
  const setRootIndex = (value: string) => {
    props.onChange({ rootIndex: toInteger(value, props.options.rootIndex, 0, 256) })
  }

  const setMaxDepth = (value: string) => {
    props.onChange({ maxDepth: toInteger(value, props.options.maxDepth, 0, 64) })
  }

  return (
    <Panel
      title={<h2>Parser Options</h2>}
      class="parser-options-panel"
      collapsible
      defaultCollapsed
      expandLabel="Show options"
      collapseLabel="Hide options"
    >
      <div class="options-grid">
        <label class="option-field">
          <span>Root index</span>
          <input
            type="number"
            min="0"
            max="256"
            value={props.options.rootIndex}
            aria-describedby="parser-option-root-index-help"
            onInput={(event) => setRootIndex(event.currentTarget.value)}
          />
          <small id="parser-option-root-index-help" class="field-hint">
            {PARSER_OPTION_DESCRIPTIONS.rootIndex}
          </small>
        </label>
        <label class="option-field option-field--checkbox">
          <input
            type="checkbox"
            checked={props.options.strict}
            aria-describedby="parser-option-strict-help"
            onChange={(event) => props.onChange({ strict: event.currentTarget.checked })}
          />
          <div>
            <span>Strict parsing</span>
            <br />
            <small id="parser-option-strict-help" class="field-hint">
              {PARSER_OPTION_DESCRIPTIONS.strict}
            </small>
          </div>
        </label>
        <label class="option-field">
          <span>Max nested depth</span>
          <input
            type="number"
            min="0"
            max="64"
            value={props.options.maxDepth}
            aria-describedby="parser-option-max-depth-help"
            onInput={(event) => setMaxDepth(event.currentTarget.value)}
          />
          <small id="parser-option-max-depth-help" class="field-hint">
            {PARSER_OPTION_DESCRIPTIONS.maxDepth}
          </small>
        </label>
      </div>
      <TextArea
        label="Custom TLB"
        hint={PARSER_OPTION_DESCRIPTIONS.customTlb}
        value={props.options.customTlb}
        onInput={(event) => props.onChange({ customTlb: event.currentTarget.value })}
        placeholder="Paste TLB schema here..."
        rows={5}
        hintId="parser-option-custom-tlb-help"
      />
    </Panel>
  )
}

function toInteger(value: string, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(max, Math.max(min, parsed))
}
