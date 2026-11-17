export default function TitleBar() {
  return (
    <div className="titlebar">
      <div className="titlebar-brand">
        <span className="titlebar-dot" />
        Cozy
      </div>
      <div className="titlebar-controls">
        <button className="titlebar-btn" onClick={() => window.cozy.windowControls.minimize()} aria-label="Réduire">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3">
            <line x1="1" y1="5.5" x2="10" y2="5.5" />
          </svg>
        </button>
        <button className="titlebar-btn" onClick={() => window.cozy.windowControls.maximize()} aria-label="Agrandir">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3">
            <rect x="1" y="1" width="8" height="8" rx="1" />
          </svg>
        </button>
        <button className="titlebar-btn close" onClick={() => window.cozy.windowControls.close()} aria-label="Fermer">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3">
            <line x1="1" y1="1" x2="10" y2="10" />
            <line x1="10" y1="1" x2="1" y2="10" />
          </svg>
        </button>
      </div>
    </div>
  )
}
