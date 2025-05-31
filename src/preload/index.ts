import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getToken: (): Promise<string | undefined> => ipcRenderer.invoke('get-token'),
  saveToken: (token: string): Promise<void> => ipcRenderer.invoke('save-token', token),
  deleteToken: (): Promise<void> => ipcRenderer.invoke('delete-token')
}

// Use `contextBridge` to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
