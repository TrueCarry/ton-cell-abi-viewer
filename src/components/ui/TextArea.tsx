import { Show, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export type TextAreaProps = JSX.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
  wrapperClass?: string
  hintId?: string
}

export function TextArea(props: TextAreaProps) {
  const [local, rest] = splitProps(props, ['label', 'hint', 'wrapperClass', 'class', 'hintId'])
  const className = () => ['ui-textarea', local.class].filter(Boolean).join(' ')

  return (
    <label class={`field ${local.wrapperClass ?? ''}`.trim()}>
      <Show when={local.label}>
        <span class="field-label">{local.label}</span>
      </Show>
      <textarea
        {...rest}
        class={className()}
        aria-describedby={local.hintId ?? rest['aria-describedby']}
      />
      <Show when={local.hint}>
        <span id={local.hintId} class="field-hint">
          {local.hint}
        </span>
      </Show>
    </label>
  )
}
