import { For, splitProps, type JSX, Show } from 'solid-js'
import { cn } from '../../lib/cn'

export type SelectOption = {
  value: string
  label: string
  description?: string
}

export type SelectProps = Omit<
  JSX.SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'value'
> & {
  label?: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

export function Select(props: SelectProps) {
  const [local, rest] = splitProps(props, ['label', 'value', 'options', 'onChange', 'class'])

  return (
    <label class="ui-select-field">
      <Show when={local.label}>
        <span class="ui-select-label">{local.label}</span>
      </Show>
      <span class="ui-select-control">
        <select
          {...rest}
          value={local.value}
          onInput={(event) => local.onChange(event.currentTarget.value)}
          class={cn('ui-select', local.class)}
        >
          <For each={local.options}>
            {(option) => (
              <option value={option.value} title={option.description}>
                {option.label}
              </option>
            )}
          </For>
        </select>
        <span class="ui-select-chevron" aria-hidden="true">
          ⌄
        </span>
      </span>
    </label>
  )
}
