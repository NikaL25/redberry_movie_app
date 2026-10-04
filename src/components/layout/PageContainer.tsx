import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('container', className)}>{children}</div>
}
