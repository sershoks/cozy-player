import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

export default function Onboarding() {
  const { clientId, saveClientId, login, loggingIn, error } = useAuth()
  const [redirectUri, setRedirectUri] = useState('')
  const [input, setInput] = useState('')

  useEffect(() => {
    window.cozy.auth.getRedirectUri().then(setRedirectUri)
  }, [])

  const card = (children: ReactNode) => (
    <div className="onboarding">
      <motion.div
        className="onboarding-card"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="onboarding-mark" />
        {children}
      </motion.div>
    </div>
  )

  if (clientId === null) {
    return card(
      <>
        <h1>Bienvenue dans Cozy</h1>
        <p>Pour te connecter à ton compte Spotify, il faut d'abord créer une app développeur (gratuit, 2 minutes).</p>
        <div className="onboarding-steps">
          1. Va sur <code>developer.spotify.com/dashboard</code>
          <br />
          2. Crée une app (nom libre)
          <br />
          3. Dans ses réglages, ajoute cette Redirect URI :
          <br />
          <code>{redirectUri || '...'}</code>
          <br />
          4. Copie le <strong>Client ID</strong> et colle-le ci-dessous
        </div>
        <div className="field">
          <label htmlFor="client-id">Client ID Spotify</label>
          <input
            id="client-id"
            className="text-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ex: 3f9a1c2b..."
          />
        </div>
        <button className="btn-primary" disabled={!input.trim()} onClick={() => saveClientId(input.trim())}>
          Continuer
        </button>
      </>
    )
  }

  return card(
    <>
      <h1>Connecte ton compte</h1>
      <p>Une page va s'ouvrir dans ton navigateur pour te connecter à Spotify. Reviens ensuite ici.</p>
      <button className="btn-primary" onClick={login} disabled={loggingIn}>
        {loggingIn ? 'Connexion en cours…' : 'Se connecter à Spotify'}
      </button>
      {error && <div className="hint-error">{error}</div>}
    </>
  )
}
