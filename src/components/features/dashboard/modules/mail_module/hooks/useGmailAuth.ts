import { useState } from "react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

// --- LẤY CONFIG TỪ ENV ---
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = import.meta.env.VITE_GOOGLE_AUTH_SCOPES;
const HOST_IP = import.meta.env.VITE_AUTH_HOST || "127.0.0.1";
const PORT = Number(import.meta.env.VITE_AUTH_PORT) || 8090;

if (!CLIENT_ID) {
  console.error("❌ Thiếu VITE_GOOGLE_CLIENT_ID trong file .env");
}

export const useGmailAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("gmail_access_token"),
  );

  const [tokenExpiry, setTokenExpiry] = useState<number>(
    Number(localStorage.getItem("gmail_token_expiry") || 0),
  );

  const handleAuthSuccess = (token: string, expiresIn: string) => {
    const expiryTime = Date.now() + Number(expiresIn) * 1000 - 60000;
    setAccessToken(token);
    setTokenExpiry(expiryTime);
    localStorage.setItem("gmail_access_token", token);
    localStorage.setItem("gmail_token_expiry", expiryTime.toString());
  };

  const login = async () => {
    let authWindow: WebviewWindow | null = null;

    try {
      // 1. GỌI SERVER RUST (Hàm tự viết)
      // Hàm này chạy ngầm (thread), không block UI
      invoke("start_google_server");

      // 2. LẮNG NGHE SỰ KIỆN "google_auth_callback"
      // Đây là tên sự kiện chúng ta đặt trong file lib.rs
      await listen<string>("google_auth_callback", async (event) => {
        const url = event.payload;

        if (typeof url === "string") {
          // A. Đóng cửa sổ
          const win =
            authWindow ||
            (await WebviewWindow.getByLabel("google-auth-window"));
          if (win) {
            win.close();
          }

          // B. Parse Token
          let token = null;
          let expiresIn = null;
          if (url.includes("access_token=")) {
            const searchPart = url.includes("#")
              ? url.split("#")[1]
              : url.split("?")[1];
            const params = new URLSearchParams(searchPart);
            token = params.get("access_token");
            expiresIn = params.get("expires_in");
          }

          if (token) {
            handleAuthSuccess(token, expiresIn || "3600");
          }
        }
      });

      // 3. MỞ CỬA SỔ
      const redirectUri = `http://${HOST_IP}:${PORT}`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=${encodeURIComponent(SCOPES)}&include_granted_scopes=true&state=popup`;

      authWindow = new WebviewWindow("google-auth-window", {
        url: authUrl,
        title: "Đăng nhập Google",
        width: 500,
        height: 650,
        resizable: false,
        alwaysOnTop: true,
        center: true,
        skipTaskbar: true,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });
    } catch (error) {
      console.error("🔥 Lỗi:", error);
      if (authWindow)
        try {
          await authWindow.close();
        } catch {}
    }
  };

  const logout = () => {
    setAccessToken(null);
    setTokenExpiry(0);
    localStorage.removeItem("gmail_access_token");
    localStorage.removeItem("gmail_token_expiry");
  };

  const isTokenValid = () => {
    return accessToken && Date.now() < tokenExpiry;
  };

  return { accessToken, isTokenValid, login, logout };
};
