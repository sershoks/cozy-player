export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div className="track-list">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <span />
          <div className="skeleton skeleton-art" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="skeleton skeleton-line" style={{ width: `${55 + ((i * 13) % 30)}%` }} />
            <div className="skeleton skeleton-line" style={{ width: `${30 + ((i * 7) % 20)}%`, height: 9 }} />
          </div>
          <div className="skeleton skeleton-line" style={{ width: 28 }} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="card-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton skeleton-art" />
          <div className="skeleton skeleton-line" style={{ width: '80%' }} />
          <div className="skeleton skeleton-line" style={{ width: '55%', height: 9 }} />
        </div>
      ))}
    </div>
  )
}
