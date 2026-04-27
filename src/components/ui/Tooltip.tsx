import { type ParentProps } from 'solid-js'
import { cn } from '../../lib/cn'

export type TooltipProps = ParentProps<{
  content: string
  class?: string
}>

export function Tooltip(props: TooltipProps) {
  return (
    <span class={cn('group relative inline-flex', props.class)}>
      {props.children}
      <span
        role="tooltip"
        class="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-56 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-200 opacity-0 shadow-xl shadow-slate-950/40 transition group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {props.content}
      </span>
    </span>
  )
}
