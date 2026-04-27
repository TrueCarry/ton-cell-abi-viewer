import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  active?: boolean
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ['variant', 'active', 'class', 'children'])
  const className = () =>
    [
      'ui-button',
      `ui-button--${local.variant ?? 'primary'}`,
      local.active ? 'is-active' : '',
      local.class,
    ]
      .filter(Boolean)
      .join(' ')

  return (
    <button {...rest} class={className()}>
      {local.children}
    </button>
  )
}
