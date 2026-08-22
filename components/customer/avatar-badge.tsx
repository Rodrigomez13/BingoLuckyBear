'use client'

import Image from 'next/image'
import { getCustomerAvatar, getCustomerAvatarImageSrc } from '@/lib/customer/avatars'

interface AvatarBadgeProps {
  avatarKey?: string | null
  size?: number
  className?: string
  priority?: boolean
}

export function AvatarBadge({ avatarKey, size = 44, className = '', priority = false }: AvatarBadgeProps) {
  const avatar = getCustomerAvatar(avatarKey)

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full border border-amber-200/35 bg-zinc-950 shadow-inner shadow-black/30 ${className}`}
      style={{ width: size, height: size }}
      title={avatar.label}
    >
      <Image
        src={getCustomerAvatarImageSrc(avatar.key)}
        alt={avatar.label}
        width={size}
        height={size}
        priority={priority}
        className="h-full w-full object-cover"
      />
    </span>
  )
}
