
export enum AppID {
  DESKTOP = 'desktop',
  AGENT = 'agent',
  NOTEPAD = 'notepad',
  BROWSER = 'browser',
  SETTINGS = 'settings',
  TERMINAL = 'terminal',
  PHOTOS = 'photos',
  YOUTUBE = 'youtube',
  GMAIL = 'gmail',
  ABOUT = 'about',
  FILES = 'files',
  WEATHER = 'weather'
}

export interface UserProfile {
  email: string;
  name: string;
  avatar: string;
  isAuthenticated: boolean;
}

export interface WindowState {
  id: string;
  appId: AppID;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  appState?: any;
}

export interface TelegramConfig {
  botToken: string;
  lastUpdateId: number;
  isConnected: boolean;
  agentName: string;
  agentEmail: string;
}

export interface SystemTheme {
  wallpaper: string;
  isDarkMode: boolean;
  accentColor: string;
}

export interface FileSystemFile {
  name: string;
  content: string;
  type: 'text' | 'image';
  size?: string;
  modified: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface OSContextType {
  windows: WindowState[];
  activeWindowId: string | null;
  theme: SystemTheme;
  user: UserProfile;
  files: Record<string, FileSystemFile>;
  telegram: TelegramConfig;
  notifications: Notification[];
  memories: Record<string, string>;
  openApp: (appId: AppID, initialState?: any) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  updateWindowState: (id: string, state: any) => void;
  setTheme: (theme: Partial<SystemTheme>) => void;
  setTelegramConfig: (config: Partial<TelegramConfig>) => void;
  setUser: (user: Partial<UserProfile>) => void;
  saveFile: (name: string, content: string) => void;
  deleteFile: (name: string) => void;
  readFile: (name: string) => string | undefined;
  saveMemory: (key: string, value: string) => void;
  deleteMemory: (key: string) => void;
  showNotification: (title: string, message: string, type?: Notification['type']) => void;
}
