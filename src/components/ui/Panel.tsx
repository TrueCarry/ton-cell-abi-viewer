import { Show, createSignal, createUniqueId } from 'solid-js'
import type { JSX } from 'solid-js'

export type PanelProps = {
  title: JSX.Element
  aside?: JSX.Element
  class?: string
  children: JSX.Element
  collapsible?: boolean
  defaultCollapsed?: boolean
  collapseLabel?: string
  expandLabel?: string
}

export function Panel(props: PanelProps) {
  const [collapsed, setCollapsed] = createSignal(props.defaultCollapsed ?? false)
  const bodyId = createUniqueId()
  const isCollapsed = () => Boolean(props.collapsible && collapsed())

  return (
    <section class={`panel ${props.class ?? ''}`.trim()}>
      <div class="panel-header">
        <div class="panel-title">{props.title}</div>
        <Show when={props.aside || props.collapsible}>
          <div class="panel-aside">
            {props.aside}
            <Show when={props.collapsible}>
              <button
                type="button"
                class="panel-toggle"
                aria-expanded={!isCollapsed()}
                aria-controls={bodyId}
                data-state={isCollapsed() ? 'collapsed' : 'expanded'}
                onClick={() => setCollapsed((value) => !value)}
              >
                <span class="panel-toggle__label">
                  {isCollapsed() ? (props.expandLabel ?? 'Show') : (props.collapseLabel ?? 'Hide')}
                </span>
                <svg class="panel-toggle__chevron" aria-hidden="true" viewBox="0 0 12 12">
                  <path
                    d="M3 4.5 6 7.5 9 4.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </Show>
          </div>
        </Show>
      </div>
      <Show when={!isCollapsed()}>
        <div class="panel-body" id={bodyId}>
          {props.children}
        </div>
      </Show>
    </section>
  )
}
