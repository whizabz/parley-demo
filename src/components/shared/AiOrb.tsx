interface AiOrbProps {
  size?: 'lg' | 'sm'
  className?: string
}

export function AiOrb({ size = 'lg', className = '' }: AiOrbProps) {
  if (size === 'sm') {
    return (
      <div className={`relative h-10 w-10 shrink-0 ${className}`}>
        <div
          className="animate-orb-1 absolute inset-0 rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle, #196ecf 0%, transparent 70%)',
            filter: 'blur(10px)',
          }}
        />
        <div
          className="animate-orb-2 absolute inset-1 rounded-full opacity-70"
          style={{
            background: 'radial-gradient(circle, #002677 0%, transparent 70%)',
            filter: 'blur(8px)',
          }}
        />
        <div
          className="absolute inset-2 rounded-full opacity-50"
          style={{
            background: 'radial-gradient(circle, #196ecf 30%, #002677 70%)',
            filter: 'blur(6px)',
          }}
        />
      </div>
    )
  }

  return (
    <div className={`relative mx-auto mb-8 h-24 w-24 ${className}`}>
      <div
        className="animate-orb-1 absolute inset-0 rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle, #196ecf 0%, transparent 70%)',
          filter: 'blur(24px)',
        }}
      />
      <div
        className="animate-orb-2 absolute inset-2 rounded-full opacity-70"
        style={{
          background: 'radial-gradient(circle, #002677 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      <div
        className="absolute inset-4 rounded-full opacity-50"
        style={{
          background: 'radial-gradient(circle, #196ecf 30%, #002677 70%)',
          filter: 'blur(16px)',
        }}
      />
    </div>
  )
}
