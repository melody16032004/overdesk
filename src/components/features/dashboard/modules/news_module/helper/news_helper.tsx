import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export const openArticleInWebview = async (url: string, title: string) => {
  try {
    // Tạo label duy nhất để mở được nhiều bài báo cùng lúc
    const label = `news-${Date.now()}`;

    const webview = new WebviewWindow(label, {
      url: url,
      title: title, // Tiêu đề cửa sổ là tiêu đề bài báo
      width: 1000,
      height: 800,
      resizable: true,
      decorations: true,
      center: true,
      focus: true,
    });

    webview.once("tauri://error", (e) => console.error("Webview error:", e));
  } catch (error) {
    console.error("Cannot create window:", error);
  }
};

export const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Mới cập nhật";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Vừa xong";
    if (hours < 24) return `${hours} giờ trước`;
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  } catch (e) {
    return "";
  }
};
