import { usePlayerContext } from '../hooks/PlayerContext'

export default function DeviceHint() {
  const { engineState, engineMessage, authRequired, status, restart } = usePlayerContext()

  if (engineState === 'starting') {
    return <div className="hint-banner">Démarrage du lecteur audio…</div>
  }

  if (engineState === 'error') {
    return (
      <div className="hint-banner error">
        Le lecteur audio n'a pas pu démarrer : {engineMessage ?? 'erreur inconnue'}
        <button className="hint-retry-btn" onClick={() => restart()}>
          Réessayer
        </button>
      </div>
    )
  }

  if (authRequired && !status) {
    return (
      <div className="hint-banner">
        Un onglet vient de s'ouvrir pour autoriser Cozy à lire de l'audio sur ton compte Spotify — approuve
        l'accès, puis reviens ici. Ça ne se reproduira plus au prochain lancement.
        <button className="hint-retry-btn" onClick={() => restart()}>
          Renvoyer le lien
        </button>
      </div>
    )
  }

  return null
}
