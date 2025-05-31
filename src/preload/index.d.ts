import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      getToken: () => Promise<string | undefined>;
      saveToken: (token: string) => Promise<void>;
      deleteToken: () => Promise<void>;
    };
  }
}
