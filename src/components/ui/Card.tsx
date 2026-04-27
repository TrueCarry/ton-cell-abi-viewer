import { splitProps, type JSX, type ParentProps } from 'solid-js'
import { cn } from '../../lib/cn'

export type CardProps = ParentProps<
  JSX.HTMLAttributes<HTMLElement> & {
    interactive?: boolean
    selected?: boolean
  }
>

export function Card(props: CardProps) {
  const [local, rest] = splitProps(props, ['class', 'children', 'interactive', 'selected'])

  return (
    <section
      {...rest}
      class={cn(
        'rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-slate-950/30 backdrop-blur',
        local.interactive && 'transition hover:border-cyan-300/30 hover:bg-slate-900/90',
        local.selected && 'border-cyan-300/50 ring-1 ring-cyan-300/30',
        local.class,
      )}
    >
      {local.children}
    </section>
  )
}

export type CardSectionProps = ParentProps<JSX.HTMLAttributes<HTMLDivElement>>

export function CardHeader(props: CardSectionProps) {
  const [local, rest] = splitProps(props, ['class', 'children'])
  return (
    <div
      {...rest}
      class={cn('flex items-start justify-between gap-4 border-b border-white/10 p-5', local.class)}
    >
      {local.children}
    </div>
  )
}

export function CardTitle(props: ParentProps<JSX.HTMLAttributes<HTMLHeadingElement>>) {
  const [local, rest] = splitProps(props, ['class', 'children'])
  return (
    <h2 {...rest} class={cn('text-base font-semibold tracking-tight text-white', local.class)}>
      {local.children}
    </h2>
  )
}

export function CardContent(props: CardSectionProps) {
  const [local, rest] = splitProps(props, ['class', 'children'])
  return (
    <div {...rest} class={cn('p-5', local.class)}>
      {local.children}
    </div>
  )
}

export function CardFooter(props: CardSectionProps) {
  const [local, rest] = splitProps(props, ['class', 'children'])
  return (
    <div {...rest} class={cn('border-t border-white/10 p-5', local.class)}>
      {local.children}
    </div>
  )
}
