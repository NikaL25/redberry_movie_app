import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

function getButtonClasses(variant: ButtonVariant = 'default', size: ButtonSize = 'default', className?: string) {
  const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50'
  const variantMap: Record<ButtonVariant, string> = {
    default: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-slate-600 bg-transparent text-white hover:bg-slate-800',
    secondary: 'bg-slate-800 text-white hover:bg-slate-700',
    ghost: 'bg-transparent text-white hover:bg-slate-800',
    destructive: 'bg-red-700 text-white hover:bg-red-800',
    link: 'bg-transparent text-red-500 underline-offset-4 hover:underline',
  }
  const sizeMap: Record<ButtonSize, string> = {
    default: 'h-10 px-4 text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-12 px-5 text-base',
    icon: 'h-10 w-10 p-0',
  }
  return `${base} ${variantMap[variant]} ${sizeMap[size]} ${className ?? ''}`.trim()
}

export function Button({
  className,
  type = 'button',
  variant = 'default',
  size = 'default',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={getButtonClasses(variant, size, className)} {...props} />
}

