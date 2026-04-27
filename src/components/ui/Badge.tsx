import { splitProps, type JSX, type ParentProps } from 'solid-js'
import { cn } from '../../lib/cn'

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning'
export type BadgeProps = ParentProps<
  JSX.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }
>

const variants: Record<BadgeVariant, string> = {
  neutral: 'border-white/10 bg-white/[0.06] text-slate-300',
  accent: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
  success: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
  warning: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
}

export function Badge(props: BadgeProps) {
  const [local, rest] = splitProps(props, ['variant', 'class', 'children'])
  const variant = () => local.variant ?? 'neutral'

  return (
    <span
      {...rest}
      class={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium leading-none',
        variants[variant()],
        local.class,
      )}
    >
      {local.children}
    </span>
  )
}
