import { LuBadgeCheck } from 'react-icons/lu'
import { StatusPill, type StatusPillTone } from '@/shared/ui'
import type { InquiryStatus } from '../types'

export const inquiryStatusConfig: Record<
  InquiryStatus,
  { label: string; tone: StatusPillTone; icon?: React.ComponentType<{ size?: number }> }
> = {
  new: { label: 'Nowe', tone: 'default' },
  read: { label: 'Przeczytane', tone: 'muted' },
  in_progress: { label: 'W rozmowie', tone: 'positive' },
  closed: { label: 'Zamknięte', tone: 'muted' },
  purchase_confirmed: { label: 'Zakup potwierdzony', tone: 'default', icon: LuBadgeCheck },
}

interface InquiryStatusBadgeProps {
  status: InquiryStatus
  size?: 'sm' | 'md' | 'lg'
}

export const InquiryStatusBadge = ({ status }: InquiryStatusBadgeProps) => {
  const config = inquiryStatusConfig[status]
  return (
    <StatusPill
      label={config.label}
      tone={config.tone}
      icon={config.icon}
      dot={!config.icon}
    />
  )
}
