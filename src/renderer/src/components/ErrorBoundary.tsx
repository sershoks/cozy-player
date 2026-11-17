import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="empty-state">
          Une erreur est survenue en affichant cette page.
          <br />
          {this.state.error.message}
        </div>
      )
    }
    return this.props.children
  }
}
