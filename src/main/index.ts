import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { registerIpcHandlers } from './ipc'
import { librespot } from './librespot'

let mainWindow: BrowserWindow | null = null
let miniPlayerWindow: BrowserWindow | null = null
let miniPlayerBounds: { x: number; y: number } | null = null
let miniPlayerAutoOpened = false // opened by minimizing, not by the user's own toggle click

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 880,
    minHeight: 560,
    show: false,
    frame: false,
    backgroundColor: '#1b1512',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    webPreferences: {
      // electron-vite emits the preload as ESM (.mjs)
      preload: path.join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.on('enter-full-screen', () => mainWindow?.webContents.send('window:fullScreenChanged', true))
  mainWindow.on('leave-full-screen', () => mainWindow?.webContents.send('window:fullScreenChanged', false))

  // Minimizing the big player hands off to the floating mini player instead
  // of just disappearing to the taskbar; restoring hands control back.
  mainWindow.on('minimize', () => {
    if (!miniPlayerWindow) {
      miniPlayerAutoOpened = true
      openMiniPlayer()
    }
  })
  mainWindow.on('restore', () => {
    if (miniPlayerAutoOpened) {
      miniPlayerAutoOpened = false
      miniPlayerWindow?.close()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    miniPlayerWindow?.close()
  })

  if (!app.isPackaged) {
    mainWindow.webContents.on('console-message', (_e, _level, message, line, sourceId) => {
      console.log(`[renderer] ${message} (${sourceId}:${line})`)
    })
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  loadApp(mainWindow)
}

function loadApp(win: BrowserWindow, mode?: 'mini'): void {
  const query = mode ? `?mode=${mode}` : ''
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}${query}`)
  } else if (mode) {
    win.loadFile(path.join(__dirname, '../renderer/index.html'), { query: { mode } })
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

function openMiniPlayer(): void {
  if (miniPlayerWindow) {
    miniPlayerWindow.focus()
    return
  }

  miniPlayerWindow = new BrowserWindow({
    title: 'Cozy — mini',
    width: 360,
    height: 108,
    x: miniPlayerBounds?.x,
    y: miniPlayerBounds?.y,
    minWidth: 300,
    minHeight: 96,
    maxHeight: 140,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  miniPlayerWindow.setAlwaysOnTop(true, 'floating')
  miniPlayerWindow.on('ready-to-show', () => miniPlayerWindow?.show())
  miniPlayerWindow.on('move', () => {
    const [x, y] = miniPlayerWindow?.getPosition() ?? []
    if (x !== undefined && y !== undefined) miniPlayerBounds = { x, y }
  })
  miniPlayerWindow.on('closed', () => {
    miniPlayerWindow = null
    miniPlayerAutoOpened = false
  })

  loadApp(miniPlayerWindow, 'mini')
}

function toggleMiniPlayer(): void {
  if (miniPlayerWindow) {
    miniPlayerAutoOpened = false
    miniPlayerWindow.close()
  } else {
    openMiniPlayer()
  }
}

app.whenReady().then(async () => {
  registerIpcHandlers(() => mainWindow)

  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.on('window:close', () => mainWindow?.close())
  ipcMain.on('window:setFullScreen', (_e, value: boolean) => mainWindow?.setFullScreen(value))
  ipcMain.handle('window:isFullScreen', () => mainWindow?.isFullScreen() ?? false)
  ipcMain.on('window:toggleMiniPlayer', () => toggleMiniPlayer())
  ipcMain.on('window:closeMiniPlayer', () => {
    miniPlayerAutoOpened = false
    miniPlayerWindow?.close()
    mainWindow?.restore()
  })

  createWindow()

  try {
    await librespot.start()
  } catch (err) {
    console.error('[main] failed to start go-librespot:', err)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  librespot.stop()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  librespot.stop()
})
