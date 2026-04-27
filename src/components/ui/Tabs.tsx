import { For, Show } from 'solid-js'
import { cn } from '../../lib/cn'
import { uiTokens } from './tokens'

export type TabItem = {
  value: string
  label: string
  badge?: string
}

export type TabsProps = {
  items: readonly TabItem[]
  value: string
  onChange: (value: string) => void
  class?: string
  ariaLabel?: string
}

export function Tabs(props: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={props.ariaLabel ?? 'Tabs'}
      class={cn(
        'inline-flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-slate-950/70 p-1',
        props.class,
      )}
    >
      <For each={props.items}>
        {(item) => {
          const selected = () => props.value === item.value
          return (
            <button
              type="button"
              role="tab"
              aria-selected={selected()}
              onClick={() => props.onChange(item.value)}
              class={cn(
                'inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-medium transition',
                selected()
                  ? 'bg-white text-slate-950 shadow-sm shadow-cyan-950/20'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100',
                uiTokens.focusRing,
              )}
            >
              {item.label}
              <Show when={item.badge}>
                <span class="rounded-full bg-slate-900/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                  {item.badge}
                </span>
              </Show>
            </button>
          )
        }}
      </For>
    </div>
  )
}
