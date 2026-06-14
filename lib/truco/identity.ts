import { getCustomerAvatar, isCustomerAvatarKey, type CustomerAvatarKey } from '@/lib/customer/avatars'

export interface TrucoIdentity {
  name: string
  avatarKey: CustomerAvatarKey
}

export function cleanTrucoPlayerName(value: unknown) {
  return String(value ?? '')
    .trim()
    .replace(/[^\p{L}\p{N} _.-]/gu, '')
    .replace(/\s+/g, ' ')
    .slice(0, 24)
}

export function parseTrucoIdentity(value: unknown): TrucoIdentity | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as { name?: unknown; avatarKey?: unknown; avatar_key?: unknown }
  const name = cleanTrucoPlayerName(candidate.name)
  const avatarValue = candidate.avatarKey ?? candidate.avatar_key
  const avatarKey = isCustomerAvatarKey(avatarValue) ? avatarValue : getCustomerAvatar().key

  if (name.length < 3) return null
  return { name, avatarKey }
}
