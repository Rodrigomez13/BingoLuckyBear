import Image from 'next/image'

interface BearLogoProps {
  size?: number
  sad?: boolean
  className?: string
  variant?: 'solo' | 'context'
}

export function BearLogo({ size = 100, sad = false, className = '', variant = 'solo' }: BearLogoProps) {
  if (!sad) {
    const src = variant === 'context' ? '/logo-contexto.svg' : '/logo-solo.svg'

    return (
      <Image
        src={src}
        alt="Lucky Bingo Bear"
        width={size}
        height={size}
        className={`object-contain ${className}`}
      />
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Ears */}
      <circle cx="20" cy="20" r="18" fill="#D97706" />
      <circle cx="20" cy="20" r="10" fill="#FCD34D" />
      <circle cx="80" cy="20" r="18" fill="#D97706" />
      <circle cx="80" cy="20" r="10" fill="#FCD34D" />
      
      {/* Head */}
      <circle cx="50" cy="55" r="42" fill="#F59E0B" />
      
      {/* Face */}
      <ellipse cx="50" cy="65" rx="25" ry="20" fill="#FEF3C7" />
      
      {/* Eyes */}
      <circle cx="35" cy="50" r="6" fill="#1C1917" />
      <circle cx="65" cy="50" r="6" fill="#1C1917" />
      <circle cx="37" cy="48" r="2" fill="white" />
      <circle cx="67" cy="48" r="2" fill="white" />
      
      {/* Nose */}
      <ellipse cx="50" cy="62" rx="8" ry="6" fill="#92400E" />
      <ellipse cx="50" cy="60" rx="3" ry="2" fill="#D97706" />
      
      {/* Mouth */}
      {sad ? (
        <path
          d="M 40 78 Q 50 72 60 78"
          stroke="#92400E"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <path
          d="M 40 72 Q 50 82 60 72"
          stroke="#92400E"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      )}
      
      {/* Lucky clover on ear */}
      <g transform="translate(75, 8) scale(0.4)">
        <circle cx="0" cy="-8" r="6" fill="#22C55E" />
        <circle cx="-8" cy="0" r="6" fill="#22C55E" />
        <circle cx="8" cy="0" r="6" fill="#22C55E" />
        <circle cx="0" cy="8" r="6" fill="#22C55E" />
        <rect x="-1.5" y="8" width="3" height="10" fill="#16A34A" />
      </g>
    </svg>
  )
}
