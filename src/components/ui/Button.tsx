import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'red' | 'light' | 'dark' | 'ghost'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

const variants: Record<Variant, string> = {
  red: 'button button-red',
  light: 'button button-light',
  dark: 'button button-dark',
  ghost: 'button button-ghost',
}

export function Button({ variant = 'red', className, type = 'button', ...props }: Props) {
  return <button type={type} className={cn(variants[variant], className)} {...props} />
}
