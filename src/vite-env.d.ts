/// <reference types="vite/client" />
export {}; // Dòng này để đảm bảo file được coi là module

declare global {
  interface Window {
    __TAURI__?: object; // Khai báo __TAURI__ là optional
  }
}
