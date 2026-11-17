import type { CozyApi } from './index'

declare global {
  interface Window {
    cozy: CozyApi
  }
}

export {}
