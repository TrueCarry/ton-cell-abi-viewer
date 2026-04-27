import { splitProps, type JSX, type ParentProps } from 'solid-js'
import { cn } from '../../lib/cn'

export type AlertVariant = 'info' | 'error' | 'success'
export type AlertProps = ParentProps<
  JSX.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant; title?: string }
>

const variants: Record<AlertVariant, string> = {
  info: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-50',
  error: 'border-rose-300/25 bg-rose-500/10 text-rose-50',
  success: 'border-emerald-300/25 bg-emerald-500/10 text-emerald-50',
}

export function Alert(props: AlertProps) {
  const [local, rest] = splitProps(props, ['variant', 'title', 'class', 'children'])
  const variant = () => local.variant ?? 'info'

  return (
    <div
      {...rest}
      class={cn('rounded-2xl border px-4 py-3 text-sm leading-6', variants[variant()], local.class)}
    >
      {local.title && <div class="mb-1 font-medium text-white">{local.title}</div>}
      <div class="text-current/85">{local.children}</div>
    </div>
  )
}
